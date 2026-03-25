import Map "mo:core/Map";
import Principal "mo:core/Principal";
import Nat "mo:core/Nat";
import Text "mo:core/Text";
import Iter "mo:core/Iter";
import Runtime "mo:core/Runtime";
import Time "mo:core/Time";
import Array "mo:core/Array";
import Order "mo:core/Order";
import Bool "mo:core/Bool";
import AccessControl "authorization/access-control";
import MixinAuthorization "authorization/MixinAuthorization";

actor {
  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

  /// User Profile

  public type UserProfile = {
    name : Text;
  };

  let userProfiles = Map.empty<Principal, UserProfile>();

  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can access profiles");
    };
    userProfiles.get(caller);
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
    if (not Principal.equal(caller, user) and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own profile");
    };
    userProfiles.get(user);
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can save profiles");
    };
    userProfiles.add(caller, profile);
  };

  /// Build entities

  type Hero = {
    id : Nat;
    name : Text;
    imageUrl : Text;
    tier : Text;
  };

  type Skill = {
    id : Nat;
    name : Text;
    rarity : Text;
    imageUrl : Text;
  };

  type Item = {
    id : Nat;
    name : Text;
    imageUrl : Text;
  };

  type Branch = {
    id : Nat;
    name : Text;
    imageUrl : Text;
  };

  public type Build = {
    id : Nat;
    name : Text;
    authorId : Principal;
    heroIds : [Nat];
    requiredSkillIds : [Nat];
    forbiddenSkillIds : [Nat];
    hint : Text;
    costLegendary : Nat;
    costRare : Nat;
    costBasic : Nat;
    rounds : Nat;
    isPublic : Bool;
    createdAt : Int;
  };

  public type RecordedBuild = {
    id : Nat;
    authorId : Principal;
    title : Text;
    heroId : Nat;
    createdAt : Int;
  };

  public type TierListData = {
    userId : Principal;
    data : Text;
  };

  module Build {
    public func compare(build1 : Build, build2 : Build) : Order.Order {
      Nat.compare(build1.id, build2.id);
    };
  };

  module RecordedBuild {
    public func compare(rb1 : RecordedBuild, rb2 : RecordedBuild) : Order.Order {
      Nat.compare(rb1.id, rb2.id);
    };
  };

  func filterBuildsByExcludedSkills(builds : [Build], excludedSkillIds : [Nat]) : [Build] {
    builds.filter(
      func(build) {
        let overlap = build.requiredSkillIds.any(
          func(skillId) {
            excludedSkillIds.any(func(excludedId) { Nat.equal(skillId, excludedId) });
          }
        );
        not overlap;
      }
    );
  };

  /// Storage

  let heroStore = Map.empty<Nat, Hero>();
  let skillStore = Map.empty<Nat, Skill>();
  let itemStore = Map.empty<Nat, Item>();
  let branchStore = Map.empty<Nat, Branch>();
  let buildStore = Map.empty<Nat, Build>();
  let recordedBuildStore = Map.empty<Nat, RecordedBuild>();
  let tierListStore = Map.empty<Principal, TierListData>();

  /// ID management

  func getNextHeroId() : Nat {
    if (heroStore.isEmpty()) { return 1 };
    let keys = heroStore.keys();
    switch (keys.reverse().next()) {
      case (?maxId) { maxId + 1 };
      case (null) { 1 };
    };
  };

  func getNextSkillId() : Nat {
    if (skillStore.isEmpty()) { return 1 };
    let keys = skillStore.keys();
    switch (keys.reverse().next()) {
      case (?maxId) { maxId + 1 };
      case (null) { 1 };
    };
  };

  func getNextItemId() : Nat {
    if (itemStore.isEmpty()) { return 1 };
    let keys = itemStore.keys();
    switch (keys.reverse().next()) {
      case (?maxId) { maxId + 1 };
      case (null) { 1 };
    };
  };

  func getNextBranchId() : Nat {
    if (branchStore.isEmpty()) { return 1 };
    let keys = branchStore.keys();
    switch (keys.reverse().next()) {
      case (?maxId) { maxId + 1 };
      case (null) { 1 };
    };
  };

  func getNextBuildId() : Nat {
    if (buildStore.isEmpty()) { return 1 };
    let keys = buildStore.keys();
    switch (keys.reverse().next()) {
      case (?maxId) { maxId + 1 };
      case (null) { 1 };
    };
  };

  func getNextRecordedBuildId() : Nat {
    if (recordedBuildStore.isEmpty()) { return 1 };
    let keys = recordedBuildStore.keys();
    switch (keys.reverse().next()) {
      case (?maxId) { maxId + 1 };
      case (null) { 1 };
    };
  };

  /// Hero CRUD (admin-only)

  public shared ({ caller }) func addHero(hero : Hero) : async Nat {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can perform this action");
    };
    let id = getNextHeroId();
    let newHero : Hero = { hero with id };
    heroStore.add(id, newHero);
    id;
  };

  public query func getAllHeroes() : async [Hero] {
    heroStore.values().toArray();
  };

  public shared ({ caller }) func updateHero(updatedHero : Hero) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can perform this action");
    };
    if (not heroStore.containsKey(updatedHero.id)) {
      Runtime.trap("Hero not found");
    };
    heroStore.add(updatedHero.id, updatedHero);
  };

  public shared ({ caller }) func deleteHero(heroId : Nat) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can perform this action");
    };
    if (not heroStore.containsKey(heroId)) {
      Runtime.trap("Hero not found");
    };
    heroStore.remove(heroId);
  };

  /// Skill CRUD (admin-only)

  public shared ({ caller }) func addSkill(skill : Skill) : async Nat {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can perform this action");
    };
    let id = getNextSkillId();
    let newSkill : Skill = { skill with id };
    skillStore.add(id, newSkill);
    id;
  };

  public query func getAllSkills() : async [Skill] {
    skillStore.values().toArray();
  };

  public shared ({ caller }) func updateSkill(updatedSkill : Skill) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can perform this action");
    };
    if (not skillStore.containsKey(updatedSkill.id)) {
      Runtime.trap("Skill not found");
    };
    skillStore.add(updatedSkill.id, updatedSkill);
  };

  public shared ({ caller }) func deleteSkill(skillId : Nat) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can perform this action");
    };
    if (not skillStore.containsKey(skillId)) {
      Runtime.trap("Skill not found");
    };
    skillStore.remove(skillId);
  };

  /// Item CRUD (admin-only)

  public shared ({ caller }) func addItem(item : Item) : async Nat {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can perform this action");
    };
    let id = getNextItemId();
    let newItem : Item = { item with id };
    itemStore.add(id, newItem);
    id;
  };

  public query func getAllItems() : async [Item] {
    itemStore.values().toArray();
  };

  public shared ({ caller }) func updateItem(updatedItem : Item) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can perform this action");
    };
    if (not itemStore.containsKey(updatedItem.id)) {
      Runtime.trap("Item not found");
    };
    itemStore.add(updatedItem.id, updatedItem);
  };

  public shared ({ caller }) func deleteItem(itemId : Nat) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can perform this action");
    };
    if (not itemStore.containsKey(itemId)) {
      Runtime.trap("Item not found");
    };
    itemStore.remove(itemId);
  };

  /// Branch CRUD (admin-only)

  public shared ({ caller }) func addBranch(branch : Branch) : async Nat {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can perform this action");
    };
    let id = getNextBranchId();
    let newBranch : Branch = { branch with id };
    branchStore.add(id, newBranch);
    id;
  };

  public query func getAllBranches() : async [Branch] {
    branchStore.values().toArray();
  };

  public shared ({ caller }) func updateBranch(updatedBranch : Branch) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can perform this action");
    };
    if (not branchStore.containsKey(updatedBranch.id)) {
      Runtime.trap("Branch not found");
    };
    branchStore.add(updatedBranch.id, updatedBranch);
  };

  public shared ({ caller }) func deleteBranch(branchId : Nat) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can perform this action");
    };
    if (not branchStore.containsKey(branchId)) {
      Runtime.trap("Branch not found");
    };
    branchStore.remove(branchId);
  };

  /// Builds (user CRUD, admins manage all)

  public shared ({ caller }) func createBuild(newBuild : Build) : async Nat {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can create builds");
    };
    let id = getNextBuildId();
    let build : Build = {
      newBuild with
      id;
      authorId = caller;
      createdAt = Time.now();
    };
    buildStore.add(id, build);
    id;
  };

  public shared ({ caller }) func updateBuild(build : Build) : async () {
    let existing = buildStore.get(build.id);
    if (existing == null) { Runtime.trap("Build not found") };
    let current = switch (existing) {
      case (null) { Runtime.trap("Build not found") };
      case (?b) { b };
    };
    if (not (Principal.equal(caller, current.authorId) or AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only the author or admin can update this build");
    };
    buildStore.add(build.id, build);
  };

  public shared ({ caller }) func deleteBuildById(buildId : Nat) : async () {
    let existing = buildStore.get(buildId);
    if (existing == null) { Runtime.trap("Build not found") };
    let current = switch (existing) {
      case (null) { Runtime.trap("Build not found") };
      case (?b) { b };
    };
    if (not (Principal.equal(caller, current.authorId) or AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only the author or admin can delete this build");
    };
    buildStore.remove(buildId);
  };

  public query func getPublicBuilds() : async [Build] {
    buildStore.values().toArray().filter(func(b) { b.isPublic }).sort();
  };

  public query ({ caller }) func getMyBuilds() : async [Build] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can access their builds");
    };
    buildStore.values().toArray().filter(func(b) { Principal.equal(b.authorId, caller) }).sort();
  };

  public query func countPublicBuildsBySkill(skillId : Nat) : async Nat {
    var count = 0;
    for (build in buildStore.values()) {
      if (
        build.isPublic and build.requiredSkillIds.any(
          func(id) { id == skillId }
        )
      ) {
        count += 1;
      };
    };
    count;
  };

  public query func getPublicBuildsExcludingSkills(excludedSkillIds : [Nat]) : async [Build] {
    let publicBuilds = buildStore.values().toArray().filter(func(b) { b.isPublic });
    filterBuildsByExcludedSkills(publicBuilds, excludedSkillIds);
  };

  public shared ({ caller }) func toggleBuildVisibility(buildId : Nat) : async () {
    let build = buildStore.get(buildId);
    if (build == null) { Runtime.trap("Build not found") };
    let current = switch (build) {
      case (null) { Runtime.trap("Build not found") };
      case (?b) { b };
    };
    if (not (Principal.equal(current.authorId, caller) or AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only the author or admin can toggle visibility");
    };
    let updatedBuild : Build = {
      current with isPublic = not current.isPublic;
    };
    buildStore.add(buildId, updatedBuild);
  };

  /// Recorded builds

  public shared ({ caller }) func createRecordedBuild(recordedBuild : RecordedBuild) : async Nat {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can create recorded builds");
    };
    let id = getNextRecordedBuildId();
    let newRecordedBuild : RecordedBuild = {
      recordedBuild with
      id;
      authorId = caller;
      createdAt = Time.now();
    };
    recordedBuildStore.add(id, newRecordedBuild);
    id;
  };

  public shared ({ caller }) func deleteRecordedBuild(recordedBuildId : Nat) : async () {
    let recordedBuild = recordedBuildStore.get(recordedBuildId);
    if (recordedBuild == null) { Runtime.trap("Recorded build not found") };
    let current = switch (recordedBuild) {
      case (null) { Runtime.trap("Recorded build not found") };
      case (?b) { b };
    };
    if (not (Principal.equal(current.authorId, caller) or AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only the author or admin can delete this recorded build");
    };
    recordedBuildStore.remove(recordedBuildId);
  };

  public query ({ caller }) func getMyRecordedBuilds() : async [RecordedBuild] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can access their recorded builds");
    };
    recordedBuildStore.values().toArray().filter(func(b) { Principal.equal(caller, b.authorId) }).sort();
  };

  public query func getRecordedBuildsByHero(heroId : Nat) : async [RecordedBuild] {
    recordedBuildStore.values().toArray().filter(func(b) { b.heroId == heroId }).sort();
  };

  /// Tier list management

  public shared ({ caller }) func saveTierList(data : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can save tier lists");
    };
    tierListStore.add(caller, { userId = caller; data });
  };

  public query func getTierList(userId : Principal) : async ?Text {
    switch (tierListStore.get(userId)) {
      case (null) { null };
      case (?tierListData) { ?tierListData.data };
    };
  };

  public shared ({ caller }) func deleteMyTierList() : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can delete their tier lists");
    };
    tierListStore.remove(caller);
  };

  public shared ({ caller }) func deleteAllTierLists() : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can perform this action");
    };
    tierListStore.clear();
  };

  /// Seed initial test data from Skill Legends Royale (say-gg.ru)

  public shared ({ caller }) func seedTestData() : async () {

    // 13 Skills with real names (bilingual via name field = EN name, RU stored as rarity field hack-free)
    let skills = [
      { id = 1; name = "РАНА / WOUND"; rarity = "basic"; imageUrl = "https://say-gg.ru/static/branches/wound.png" },
      { id = 2; name = "ЗАМОРОЗКА / FREEZE"; rarity = "rare"; imageUrl = "https://say-gg.ru/static/branches/freeze.png" },
      { id = 3; name = "ЯРОСТЬ / RAGE"; rarity = "legendary"; imageUrl = "https://say-gg.ru/static/branches/rage.png" },
      { id = 4; name = "ИСЦЕЛЕНИЕ / HEAL"; rarity = "rare"; imageUrl = "https://say-gg.ru/static/branches/heal.png" },
      { id = 5; name = "ЯД / POISON"; rarity = "basic"; imageUrl = "https://say-gg.ru/static/branches/poison.png" },
      { id = 6; name = "ЩИТ / SHIELD"; rarity = "rare"; imageUrl = "https://say-gg.ru/static/branches/shield.png" },
      { id = 7; name = "КРИТ / CRIT"; rarity = "legendary"; imageUrl = "https://say-gg.ru/static/branches/crit.png" },
      { id = 8; name = "СПРАЙТ / SPRITE"; rarity = "basic"; imageUrl = "https://say-gg.ru/static/branches/sprite.png" },
      { id = 9; name = "ХП / HP"; rarity = "basic"; imageUrl = "https://say-gg.ru/static/branches/hp.png" },
      { id = 10; name = "УЛЬТ / ULT"; rarity = "legendary"; imageUrl = "https://say-gg.ru/static/branches/ultimate.png" },
      { id = 11; name = "АТАКА / ATTACK"; rarity = "rare"; imageUrl = "https://say-gg.ru/static/branches/attack.png" },
      { id = 12; name = "ДОДЖ / DODGE"; rarity = "rare"; imageUrl = "https://say-gg.ru/static/branches/dodge.png" },
      { id = 13; name = "УСКОРЕНИЕ / HASTE"; rarity = "basic"; imageUrl = "https://say-gg.ru/static/branches/haste.png" },
    ];
    skillStore.clear();
    for (skill in skills.values()) {
      skillStore.add(skill.id, skill);
    };

    // 13 Branches (same as skill names)
    let branches = [
      { id = 1; name = "РАНА / WOUND"; imageUrl = "https://say-gg.ru/static/branches/wound.png" },
      { id = 2; name = "ЗАМОРОЗКА / FREEZE"; imageUrl = "https://say-gg.ru/static/branches/freeze.png" },
      { id = 3; name = "ЯРОСТЬ / RAGE"; imageUrl = "https://say-gg.ru/static/branches/rage.png" },
      { id = 4; name = "ИСЦЕЛЕНИЕ / HEAL"; imageUrl = "https://say-gg.ru/static/branches/heal.png" },
      { id = 5; name = "ЯД / POISON"; imageUrl = "https://say-gg.ru/static/branches/poison.png" },
      { id = 6; name = "ЩИТ / SHIELD"; imageUrl = "https://say-gg.ru/static/branches/shield.png" },
      { id = 7; name = "КРИТ / CRIT"; imageUrl = "https://say-gg.ru/static/branches/crit.png" },
      { id = 8; name = "СПРАЙТ / SPRITE"; imageUrl = "https://say-gg.ru/static/branches/sprite.png" },
      { id = 9; name = "ХП / HP"; imageUrl = "https://say-gg.ru/static/branches/hp.png" },
      { id = 10; name = "УЛЬТ / ULT"; imageUrl = "https://say-gg.ru/static/branches/ultimate.png" },
      { id = 11; name = "АТАКА / ATTACK"; imageUrl = "https://say-gg.ru/static/branches/attack.png" },
      { id = 12; name = "ДОДЖ / DODGE"; imageUrl = "https://say-gg.ru/static/branches/dodge.png" },
      { id = 13; name = "УСКОРЕНИЕ / HASTE"; imageUrl = "https://say-gg.ru/static/branches/haste.png" },
    ];
    branchStore.clear();
    for (branch in branches.values()) {
      branchStore.add(branch.id, branch);
    };

    // 65 Heroes with real images from say-gg.ru
    heroStore.clear();
    var heroId = 1;
    while (heroId <= 65) {
      let imageUrl = "https://say-gg.ru/static/heroes/" # heroId.toText() # ".jpg";
      heroStore.add(heroId, { id = heroId; name = "Герой " # heroId.toText(); imageUrl; tier = "" });
      heroId += 1;
    };

    // 99 Items with real images from say-gg.ru
    itemStore.clear();
    var itemId = 1;
    while (itemId <= 99) {
      let imageUrl = "https://say-gg.ru/static/items/" # itemId.toText() # ".jpg";
      itemStore.add(itemId, { id = itemId; name = "Предмет " # itemId.toText(); imageUrl });
      itemId += 1;
    };
  };
};
