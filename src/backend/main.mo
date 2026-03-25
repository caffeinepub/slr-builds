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
import Int "mo:core/Int";
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
  let registeredUsersStore = Map.empty<Principal, Int>();
  let uidByPrincipal = Map.empty<Principal, Text>();
  let principalByUid = Map.empty<Text, Principal>();
  var uidCounter : Nat = 1000;

  func generateUid() : Text {
    let n = uidCounter;
    uidCounter += 1;
    let chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let base = 32;
    var result = "";
    var v = n;
    var i = 0;
    while (i < 6) {
      let idx = v % base;
      let c = Text.fromChar(chars.toArray()[idx]);
      result := c # result;
      v := v / base;
      i += 1;
    };
    result;
  };

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
    if (not registeredUsersStore.containsKey(caller)) {
      registeredUsersStore.add(caller, Time.now());
    };
    if (not uidByPrincipal.containsKey(caller)) {
      let uid = generateUid();
      uidByPrincipal.add(caller, uid);
      principalByUid.add(uid, caller);
    };
  };

  public query ({ caller }) func getMyUID() : async ?Text {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      return null;
    };
    uidByPrincipal.get(caller);
  };

  public query func getUserByUID(uid : Text) : async ?(Text, Text) {
    switch (principalByUid.get(uid)) {
      case (null) { null };
      case (?p) {
        let name = switch (userProfiles.get(p)) {
          case (?prof) { prof.name };
          case (null) { "—" };
        };
        ?(uid, name);
      };
    };
  };

  public type RegisteredUser = {
    principal : Principal;
    name : Text;
    uid : Text;
    registeredAt : Int;
  };

  public query ({ caller }) func getAllRegisteredUsers() : async [RegisteredUser] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can view registered users");
    };
    let result = registeredUsersStore.entries().toArray();
    result.map(func((p, t) : (Principal, Int)) : RegisteredUser {
      let profileName = switch (userProfiles.get(p)) {
        case (?profile) { profile.name };
        case (null) { "—" };
      };
      let uid = switch (uidByPrincipal.get(p)) {
        case (?u) { u };
        case (null) { "—" };
      };
      { principal = p; name = profileName; uid; registeredAt = t };
    });
  };

  /// Friends

  let friendsStore = Map.empty<Principal, [Text]>(); // principal -> list of UIDs

  public shared ({ caller }) func addFriend(uid : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized");
    };
    switch (principalByUid.get(uid)) {
      case (null) { Runtime.trap("User not found") };
      case (?_targetPrincipal) {
        let current = switch (friendsStore.get(caller)) {
          case (?list) { list };
          case (null) { [] };
        };
        if (current.any(func(u) { u == uid })) {
          return; // already a friend
        };
        friendsStore.add(caller, Array.tabulate(current.size() + 1, func(i) { if (i < current.size()) { current[i] } else { uid } }));
      };
    };
  };

  public shared ({ caller }) func removeFriend(uid : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized");
    };
    let current = switch (friendsStore.get(caller)) {
      case (?list) { list };
      case (null) { [] };
    };
    friendsStore.add(caller, current.filter(func(u) { u != uid }));
  };

  public type FriendEntry = {
    uid : Text;
    name : Text;
  };

  public query ({ caller }) func getMyFriends() : async [FriendEntry] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      return [];
    };
    let uids = switch (friendsStore.get(caller)) {
      case (?list) { list };
      case (null) { [] };
    };
    uids.map(func(uid : Text) : FriendEntry {
      let name = switch (principalByUid.get(uid)) {
        case (null) { "—" };
        case (?p) {
          switch (userProfiles.get(p)) {
            case (?prof) { prof.name };
            case (null) { "—" };
          };
        };
      };
      { uid; name };
    });
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

  /// Chat types

  public type ChatMessage = {
    id : Nat;
    authorName : Text;
    text : Text;
    createdAt : Int;
  };

  /// Online presence types

  public type OnlineUser = {
    displayName : Text;
    lastSeen : Int;
  };

  /// Comments

  public type BuildComment = {
    id : Nat;
    buildId : Nat;
    authorId : Principal;
    authorName : Text;
    text : Text;
    createdAt : Int;
  };

  /// Votes

  public type BuildVotes = {
    likes : Nat;
    dislikes : Nat;
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

  module ChatMessage {
    public func compare(m1 : ChatMessage, m2 : ChatMessage) : Order.Order {
      Nat.compare(m1.id, m2.id);
    };
  };

  module BuildComment {
    public func compare(c1 : BuildComment, c2 : BuildComment) : Order.Order {
      Nat.compare(c1.id, c2.id);
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
  let chatStore = Map.empty<Nat, ChatMessage>();
  let onlineStore = Map.empty<Text, OnlineUser>();
  let commentStore = Map.empty<Nat, BuildComment>();
  let votesStore = Map.empty<Nat, BuildVotes>();      // buildId -> votes
  let userVoteStore = Map.empty<Text, Bool>();         // "principalText#buildId" -> true=like false=dislike

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

  func getNextChatId() : Nat {
    if (chatStore.isEmpty()) { return 1 };
    let keys = chatStore.keys();
    switch (keys.reverse().next()) {
      case (?maxId) { maxId + 1 };
      case (null) { 1 };
    };
  };

  func getNextCommentId() : Nat {
    if (commentStore.isEmpty()) { return 1 };
    let keys = commentStore.keys();
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

  public type TopAuthor = {
    authorId : Principal;
    authorName : Text;
    totalLikes : Nat;
  };

  public query func getTopBuilds(limit : Nat) : async [Build] {
    let public_ = buildStore.values().toArray().filter(func(b) { b.isPublic });
    let sorted = public_.sort(func(a, b) {
      let va = switch (votesStore.get(a.id)) { case (?v) { v.likes }; case (null) { 0 } };
      let vb = switch (votesStore.get(b.id)) { case (?v) { v.likes }; case (null) { 0 } };
      if (vb > va) { #less } else if (vb < va) { #greater } else { #equal };
    });
    if (limit >= sorted.size()) { sorted } else { Array.tabulate(limit, func(i) { sorted[i] }) };
  };

  public query func getTopAuthors(limit : Nat) : async [TopAuthor] {
    let authorLikes = Map.empty<Principal, Nat>();
    for (build in buildStore.values()) {
      let likes = switch (votesStore.get(build.id)) { case (?v) { v.likes }; case (null) { 0 } };
      let current = switch (authorLikes.get(build.authorId)) { case (?n) { n }; case (null) { 0 } };
      authorLikes.add(build.authorId, current + likes);
    };
    let entries = authorLikes.entries().toArray();
    let sorted = entries.sort(func((_, a), (_, b)) {
      if (b > a) { #less } else if (b < a) { #greater } else { #equal };
    });
    let take = if (limit >= sorted.size()) { sorted.size() } else { limit };
    Array.tabulate(take, func(i) {
      let (p, total) = sorted[i];
      let name = switch (userProfiles.get(p)) { case (?prof) { prof.name }; case (null) { "—" } };
      { authorId = p; authorName = name; totalLikes = total };
    });
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

  /// Build Comments

  public shared ({ caller }) func addBuildComment(buildId : Nat, authorName : Text, text : Text) : async Nat {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can comment");
    };
    if (text.size() == 0 or text.size() > 1000) {
      Runtime.trap("Comment must be 1-1000 characters");
    };
    let name = if (authorName.size() == 0) { "Анон" } else { authorName };
    let id = getNextCommentId();
    let comment : BuildComment = { id; buildId; authorId = caller; authorName = name; text; createdAt = Time.now() };
    commentStore.add(id, comment);
    id;
  };

  public shared ({ caller }) func addVoiceBuildComment(buildId : Nat, authorName : Text, audioData : Text) : async Nat {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can comment");
    };
    if (audioData.size() == 0 or audioData.size() > 600_000) {
      Runtime.trap("Audio too large or empty");
    };
    let name = if (authorName.size() == 0) { "Анон" } else { authorName };
    let id = getNextCommentId();
    let encoded = "VOICE:" # audioData;
    let comment : BuildComment = { id; buildId; authorId = caller; authorName = name; text = encoded; createdAt = Time.now() };
    commentStore.add(id, comment);
    id;
  };

  public query func getBuildComments(buildId : Nat) : async [BuildComment] {
    commentStore.values().toArray().filter(func(c) { c.buildId == buildId }).sort();
  };

  public shared ({ caller }) func deleteBuildComment(commentId : Nat) : async () {
    let comment = commentStore.get(commentId);
    switch (comment) {
      case (null) { Runtime.trap("Comment not found") };
      case (?c) {
        if (not (Principal.equal(c.authorId, caller) or AccessControl.isAdmin(accessControlState, caller))) {
          Runtime.trap("Unauthorized");
        };
        commentStore.remove(commentId);
      };
    };
  };

  /// Build Votes (likes / dislikes)

  public shared ({ caller }) func toggleBuildLike(buildId : Nat) : async BuildVotes {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized");
    };
    let key = caller.toText() # "#" # buildId.toText();
    let current = switch (votesStore.get(buildId)) {
      case (?v) { v };
      case (null) { { likes = 0; dislikes = 0 } };
    };
    let existingVote = userVoteStore.get(key);
    let updated : BuildVotes = switch (existingVote) {
      case (?true) {
        // already liked -> remove like
        userVoteStore.remove(key);
        { likes = if (current.likes > 0) { current.likes - 1 } else { 0 }; dislikes = current.dislikes };
      };
      case (?false) {
        // was dislike -> switch to like
        userVoteStore.add(key, true);
        { likes = current.likes + 1; dislikes = if (current.dislikes > 0) { current.dislikes - 1 } else { 0 } };
      };
      case (null) {
        userVoteStore.add(key, true);
        { likes = current.likes + 1; dislikes = current.dislikes };
      };
    };
    votesStore.add(buildId, updated);
    updated;
  };

  public shared ({ caller }) func toggleBuildDislike(buildId : Nat) : async BuildVotes {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized");
    };
    let key = caller.toText() # "#" # buildId.toText();
    let current = switch (votesStore.get(buildId)) {
      case (?v) { v };
      case (null) { { likes = 0; dislikes = 0 } };
    };
    let existingVote = userVoteStore.get(key);
    let updated : BuildVotes = switch (existingVote) {
      case (?false) {
        userVoteStore.remove(key);
        { likes = current.likes; dislikes = if (current.dislikes > 0) { current.dislikes - 1 } else { 0 } };
      };
      case (?true) {
        userVoteStore.add(key, false);
        { likes = if (current.likes > 0) { current.likes - 1 } else { 0 }; dislikes = current.dislikes + 1 };
      };
      case (null) {
        userVoteStore.add(key, false);
        { likes = current.likes; dislikes = current.dislikes + 1 };
      };
    };
    votesStore.add(buildId, updated);
    updated;
  };

  public query func getBuildVotes(buildId : Nat) : async BuildVotes {
    switch (votesStore.get(buildId)) {
      case (?v) { v };
      case (null) { { likes = 0; dislikes = 0 } };
    };
  };

  public query ({ caller }) func getMyVoteOnBuild(buildId : Nat) : async ?Bool {
    let key = caller.toText() # "#" # buildId.toText();
    userVoteStore.get(key);
  };

  /// Chat — open to all (including anonymous)

  public shared func sendChatMessage(authorName : Text, text : Text) : async Nat {
    if (text.size() == 0 or text.size() > 500) {
      Runtime.trap("Message must be 1-500 characters");
    };
    let name = if (authorName.size() == 0) { "Гость" } else { authorName };
    let id = getNextChatId();
    let msg : ChatMessage = { id; authorName = name; text; createdAt = Time.now() };
    chatStore.add(id, msg);
    if (chatStore.size() > 200) {
      switch (chatStore.keys().next()) {
        case (?oldestId) { chatStore.remove(oldestId) };
        case (null) {};
      };
    };
    id;
  };

  public shared func sendVoiceChatMessage(authorName : Text, audioData : Text) : async Nat {
    if (audioData.size() == 0 or audioData.size() > 600_000) {
      Runtime.trap("Audio too large or empty");
    };
    let name = if (authorName.size() == 0) { "Гость" } else { authorName };
    let id = getNextChatId();
    let encoded = "VOICE:" # audioData;
    let msg : ChatMessage = { id; authorName = name; text = encoded; createdAt = Time.now() };
    chatStore.add(id, msg);
    if (chatStore.size() > 200) {
      switch (chatStore.keys().next()) {
        case (?oldestId) { chatStore.remove(oldestId) };
        case (null) {};
      };
    };
    id;
  };

  public query func getChatMessages() : async [ChatMessage] {
    chatStore.values().toArray().sort();
  };

  /// Online presence

  public shared func onlineHeartbeat(displayName : Text) : async Nat {
    let name = if (displayName.size() == 0) { "Гость" } else { displayName };
    let now = Time.now();
    onlineStore.add(name, { displayName = name; lastSeen = now });
    onlineStore.size();
  };

  public query func getOnlineUsers() : async [OnlineUser] {
    let now = Time.now();
    let cutoff : Int = now - 180_000_000_000;
    onlineStore.values().toArray().filter(func(u) { u.lastSeen > cutoff });
  };

  /// Seed initial test data from Skill Legends Royale (say-gg.ru)

  public shared func seedTestData() : async () {

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

    let heroNames : [Text] = [
      "Гаррак", "Железный Страж", "Синий Клинок", "Огр", "Красный Воин",
      "Тёмный Призрак", "Белый Берсерк", "Пурпурный Маг", "Гоблин Воин", "Дикарь",
      "Труппа", "Старый Маг", "Рыжий Гном", "Крестоносец", "Серый Рыцарь",
      "Золотой Воин", "Красный Страж", "Гоблин Разбойник", "Пингвин", "Тёмный Ассассин",
      "Белый Медведь", "Рыжая Тень", "Паук", "Нага", "Плотоядный",
      "Двуглавый", "Призрак", "Эльф Лучница", "Гоблин Механик", "Древний Тролль",
      "Красный Демон", "Минотавр", "Лесная Фея", "Рыцарь", "Древолик",
      "Тёмный Лорд", "Пиратка", "Тёмный Волшебник", "Ящер", "Оборотень",
      "Викинг", "Гремлин", "Серый Волк", "Кузнец", "Синий Зверь",
      "Виноградник", "Гоблинша", "Панда", "Пират", "Пурпурный Гоблин",
      "Воин Огня", "Теневой Убийца", "Гоблин Алхимик", "Крысолов", "Анубис",
      "Зелёный Гоблин", "Синий Дракон", "Ледяная Дева", "Упырь", "Кристальный Голем",
      "Стальной Ковбой", "Изобретатель", "Огненная Демоница", "Белый Рыцарь", "Мор"
    ];
    heroStore.clear();
    var heroIdx = 0;
    while (heroIdx < 65) {
      let heroId = heroIdx + 1;
      let imageUrl = "https://say-gg.ru/static/heroes/" # heroId.toText() # ".jpg";
      heroStore.add(heroId, { id = heroId; name = heroNames[heroIdx]; imageUrl; tier = "" });
      heroIdx += 1;
    };

    itemStore.clear();
    var itemId = 1;
    while (itemId <= 99) {
      let imageUrl = "https://say-gg.ru/static/items/" # itemId.toText() # ".jpg";
      itemStore.add(itemId, { id = itemId; name = "Предмет " # itemId.toText(); imageUrl });
      itemId += 1;
    };

    buildStore.clear();
    let seedBuilds : [(Nat, Text, [Nat], [Nat], [Nat], Text, Nat, Nat, Nat, Nat)] = [
      (1,  "ЛУЧНИЦА ХЕЙСТ КРИТ УЛЬТ",              [9,13],  [7,13,10,11], [4,9],    "Лучница с ускорением, критом и ультом. Быстрый урон с дальней дистанции.",  2, 2, 2, 7),
      (2,  "СПРАЙТЫ УРОН",                          [6,8],   [8,11,7],     [4,6],    "Спрайты усиливают атаку — огромный DPS.",                                   0, 2, 3, 6),
      (3,  "ПРЕБАТТЛ ЛОББИ",                        [1,3],   [13,11,8],    [2,6],    "Быстрый старт через атаку и ускорение до битвы.",                           0, 2, 3, 5),
      (4,  "МАГ КРИТ PANDA",                        [12,10], [7,10,11],    [4,6,9],  "Маг с критом — максимальный урон без защиты.",                              2, 2, 2, 8),
      (5,  "СПРАЙТ ПРИСТ",                          [8,46],  [8,4,9],      [3,7],    "Спрайт-жрец: живучесть через исцеление и ХП.",                              0, 2, 4, 10),
      (6,  "СНАЙПЕР УЛЬТ",                          [13,1],  [10,7,13],    [4,6],    "Снайпер наносит ульт-урон через крит и ускорение.",                          2, 2, 1, 7),
      (7,  "КРАТОС",                                [1,30],  [3,11,7],     [4,9],    "Кратос: ярость, атака, крит. Агрессивный стиль первого места.",              2, 3, 1, 7),
      (8,  "EVIL BRAKER ULT + MAG CRIT + DODGE",   [16,12], [10,7,12],    [4,9],    "Злобный Ломатель: ульт, крит и уклон. Контратакует любого врага.",           2, 3, 1, 8),
      (9,  "ЯРОСТЬ",                                [7,4],   [3,11,1],     [4,6],    "Чистая ярость: рана и атака для быстрой победы.",                            1, 2, 2, 7),
      (10, "ПУДЖ-МЕДИКАЛ",                          [2,21],  [4,9,6],      [3,7],    "Пудж-медик: живёт вечно за счёт щита, ХП и исцеления.",                     1, 3, 3, 12),
      (11, "КРИТ-ДОДЖ",                             [5,18],  [7,12,11],    [4,9],    "Критует и уклоняется — классический DPS-уклонист.",                         2, 3, 1, 8),
      (12, "ВАНГВАРДНАЯ АТАКА",                     [30,52], [11,13,3],    [4,6],    "Авангардная атака с ускорением и яростью.",                               1, 2, 3, 7),
      (13, "ОГР УЛЬТ КРИТ",                         [11,1],  [10,7,9],     [5,1],    "Огр: ульт с критом и ХП. Живёт долго и бьёт сильно.",                       2, 2, 2, 9),
      (14, "ФРОСТ ЛОРД УЛЬТ",                       [3,24],  [2,10,6],     [3,7],    "Фрост Лорд замораживает и ультует. Контроль + выживание.",                   2, 3, 1, 11),
      (15, "СПРАЙТ ФРИЗ АТАКА, ЯД+ФРИЗ",           [8,2],   [8,2,11],     [4,9],    "Спрайт+фриз+атака. Яд и фриз дают огромный DoT.",                        1, 2, 3, 8),
      (16, "ПЕРЕЦ ЯРОСТЬ, РАНЫ",                    [14,9],  [3,1,11],     [4,6],    "Перец в ярости с ранами — быстрый агрессивный стиль.",                    1, 2, 2, 7),
      (17, "ЖИВУЧЕСТЬ+ТАЙМКУРС",                    [2,21],  [4,9,6],      [3,7,1],  "Максимальная живучесть: щит+ХП+исцеление. Выиграй по времени.",              1, 3, 4, 14),
      (18, "AXE_COMBO_ULT",                         [19,30], [10,11,3],    [4,6],    "Топорщик: комбо ульт+ярость. Мощный взрыв урона.",                         2, 2, 2, 7),
      (19, "РАКЕТЫ ХЕЙСТ",                          [25,19], [13,11,7],    [4,6],    "Ракетчик с ускорением: быстрые критические удары.",                          1, 2, 3, 7),
      (20, "РАНЫ-ЩИТЫ-ЦИКЛИЧНОСТЬ",                 [9,45],  [1,6,9],      [3,7],    "Цикл: рана+щит+ХП. Переживи врага и победи.",                             0, 2, 4, 11),
      (21, "ФРИЗ ПРОКИ КРИТ",                       [3,24],  [2,7,11],     [4,9],    "Заморози, затем проки крит. Контроль+урон.",                            2, 3, 1, 8),
      (22, "ПИНГВИН, ЯРОСТЬ + УЛЬТ+ ФРИЗ",          [10,3],  [3,10,2],     [4,6],    "Пингвин: ярость+ульт+заморозка. Замораживает и уничтожает.",              2, 2, 2, 8),
      (23, "МЕРТВЫЕ СПРАЙТЫ",                       [8,6],   [8,5,1],      [4,6],    "Спрайты смерти: яд+рана усиливают DoT до предела.",                         0, 1, 4, 6),
      (24, "ХП",                                    [2,45],  [9,4,6],      [3,7],    "Максимум ХП: щит+исцеление держат тебя живым.",                           1, 3, 3, 12),
      (25, "АСТРАЛ УЛЬТ",                           [15,20], [10,8,13],    [1,5],    "Астрал: спрайт+ускорение дают ульт каждый раунд.",                       2, 2, 2, 7),
      (26, "АТАК КРИТ",                             [1,11],  [11,7,13],    [4,6],    "Атака+крит+ускорение — стабильный урон каждый раунд.",                   1, 2, 3, 8),
      (27, "ЭКЗОДИЯ",                               [23,1],  [3,7,10,2],   [4,9],    "Экзодия: ярость+крит+ульт+заморозка. Самая мощная комбо-сборка.",          3, 3, 1, 7),
      (28, "ДОДЖ",                                  [5,12],  [12,11,13],   [4,9],    "Чистый уклонист: додж+атака+ускорение. Почти неуязвим.",                  1, 3, 2, 8),
      (29, "МАТХЕР",                                [22,1],  [3,11,7],     [2,4],    "Матхер: ярость+атака+крит без заморозки и исцеления.",                  2, 2, 2, 7),
      (30, "ОВЕРЛОРД СПРАЙТЫ УЛЬТ",                 [20,8],  [8,10,3],     [4,9],    "Оверлорд+спрайты+ульт — взрывной урон.",                             2, 2, 2, 8),
      (31, "БЕРСЕРК, СТИЛИТ ХП",                    [4,9],   [3,9,11],     [2,6],    "Берсерк стилит ХП: ярость+ХП баланс атаки/выживания.",              1, 2, 3, 9),
      (32, "SIN ONESHOT",                           [18,1],  [7,10,3],     [4,6,9],  "Грех: ваншот через крит+ульт+ярость. Один удар убивает.",                 3, 2, 1, 6),
      (33, "DUKE DODGE",                            [5,12],  [12,3,11],    [4,9],    "Герцог: уклон+ярость+атака. Быстрый и неуловимый.",                       1, 3, 1, 7),
      (34, "ПАУК ХЕЙСТ",                            [6,25],  [13,5,1],     [2,6],    "Паук+ускорение: яд+рана за счёт скорости.",                             0, 1, 4, 6),
      (35, "ФРОСТ МАГИЧКА, КРИТ УЛЬТ",              [8,24],  [2,7,10],     [3,9],    "Фрост-магичка: крит+ульт+заморозка. Контроль и мощь.",                   2, 3, 1, 9),
      (36, "ДРУАДА ДЕФ ЧЕРЕЗ УЛЬТ, ЩИТЫ",          [17,46], [10,6,4],     [3,7],    "Друад: защита через ульт+щиты+исцеление. Оборона.",               2, 3, 1, 12),
      (37, "ONE BRANCH DODGE",                      [5],     [12],         [],       "Только додж.",                                                          0, 1, 1, 6),
      (38, "ONE BRANCH SPRITE",                     [8],     [8],          [],       "Только спрайт.",                                                         0, 0, 2, 5),
      (39, "ONE BRANCH ATACK",                      [1],     [11],         [],       "Только атака.",                                                          0, 1, 1, 5),
      (40, "FROST NOVA LORD",                       [3,24],  [2,9,6],      [3,7],    "Фрост Нова Лорд: заморозка+ХП+щит. Мощный контролёр.",              1, 3, 2, 11),
      (41, "СНАЙПЕР АТАКА КРИТ",                    [13,26], [11,7,13],    [4,6],    "Снайпер: атака+крит+ускорение. Стабильный дальний урон.",               1, 2, 3, 8),
      (42, "ФЬЮРИ ЯРОСТЬ",                          [7,33],  [3,12,11],    [4,9],    "Фьюри: ярость+уклон+атака. Агрессивный быстрый стиль.",                 1, 2, 2, 7),
    ];
    for ((bId, bName, bHeroIds, bReqSkills, bForbSkills, bHint, bCostLeg, bCostRare, bCostBasic, bRounds) in seedBuilds.values()) {
      let b : Build = {
        id = bId;
        name = bName;
        authorId = Principal.fromText("2vxsx-fae");
        heroIds = bHeroIds;
        requiredSkillIds = bReqSkills;
        forbiddenSkillIds = bForbSkills;
        hint = bHint;
        costLegendary = bCostLeg;
        costRare = bCostRare;
        costBasic = bCostBasic;
        rounds = bRounds;
        isPublic = true;
        createdAt = Time.now();
      };
      buildStore.add(bId, b);
    };
  };
};
