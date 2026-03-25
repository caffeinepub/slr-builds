import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface Hero {
    id: bigint;
    name: string;
    tier: string;
    imageUrl: string;
}
export interface Build {
    id: bigint;
    costRare: bigint;
    heroIds: Array<bigint>;
    authorId: Principal;
    hint: string;
    requiredSkillIds: Array<bigint>;
    name: string;
    createdAt: bigint;
    costLegendary: bigint;
    costBasic: bigint;
    isPublic: boolean;
    rounds: bigint;
    forbiddenSkillIds: Array<bigint>;
}
export interface Item {
    id: bigint;
    name: string;
    imageUrl: string;
}
export interface Skill {
    id: bigint;
    name: string;
    imageUrl: string;
    rarity: string;
}
export interface Branch {
    id: bigint;
    name: string;
    imageUrl: string;
}
export interface RecordedBuild {
    id: bigint;
    heroId: bigint;
    title: string;
    authorId: Principal;
    createdAt: bigint;
}
export interface UserProfile {
    name: string;
}
export interface ChatMessage {
    id: bigint;
    authorName: string;
    text: string;
    createdAt: bigint;
}
export interface OnlineUser {
    displayName: string;
    lastSeen: bigint;
}
export interface RegisteredUser {
    principal: Principal;
    name: string;
    uid: string;
    registeredAt: bigint;
}
export interface BuildComment {
    id: bigint;
    buildId: bigint;
    authorId: Principal;
    authorName: string;
    text: string;
    createdAt: bigint;
}
export interface BuildVotes {
    likes: bigint;
    dislikes: bigint;
}
export interface FriendEntry {
    uid: string;
    name: string;
}
export interface TopAuthor {
    authorId: Principal;
    authorName: string;
    totalLikes: bigint;
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    _initializeAccessControlWithSecret(userSecret: string): Promise<void>;
    addBranch(branch: Branch): Promise<bigint>;
    addHero(hero: Hero): Promise<bigint>;
    addItem(item: Item): Promise<bigint>;
    addSkill(skill: Skill): Promise<bigint>;
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    countPublicBuildsBySkill(skillId: bigint): Promise<bigint>;
    createBuild(newBuild: Build): Promise<bigint>;
    createRecordedBuild(recordedBuild: RecordedBuild): Promise<bigint>;
    deleteAllTierLists(): Promise<void>;
    deleteBranch(branchId: bigint): Promise<void>;
    deleteBuildById(buildId: bigint): Promise<void>;
    deleteHero(heroId: bigint): Promise<void>;
    deleteItem(itemId: bigint): Promise<void>;
    deleteMyTierList(): Promise<void>;
    deleteRecordedBuild(recordedBuildId: bigint): Promise<void>;
    deleteSkill(skillId: bigint): Promise<void>;
    getAllBranches(): Promise<Array<Branch>>;
    getAllHeroes(): Promise<Array<Hero>>;
    getAllItems(): Promise<Array<Item>>;
    getAllSkills(): Promise<Array<Skill>>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getMyBuilds(): Promise<Array<Build>>;
    getMyRecordedBuilds(): Promise<Array<RecordedBuild>>;
    getPublicBuilds(): Promise<Array<Build>>;
    getPublicBuildsExcludingSkills(excludedSkillIds: Array<bigint>): Promise<Array<Build>>;
    getRecordedBuildsByHero(heroId: bigint): Promise<Array<RecordedBuild>>;
    getTierList(userId: Principal): Promise<string | null>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    isCallerAdmin(): Promise<boolean>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    saveTierList(data: string): Promise<void>;
    seedTestData(): Promise<void>;
    seedSkillsAndBranches(): Promise<void>;
    seedHeroes(): Promise<void>;
    seedItems(): Promise<void>;
    seedBuilds(): Promise<void>;
    toggleBuildVisibility(buildId: bigint): Promise<void>;
    updateBranch(updatedBranch: Branch): Promise<void>;
    updateBuild(build: Build): Promise<void>;
    updateHero(updatedHero: Hero): Promise<void>;
    updateItem(updatedItem: Item): Promise<void>;
    updateSkill(updatedSkill: Skill): Promise<void>;
    // Chat
    sendChatMessage(authorName: string, senderUID: string, text: string): Promise<bigint>;
    sendVoiceChatMessage(authorName: string, senderUID: string, audioData: string): Promise<bigint>;
    getChatMessages(): Promise<Array<ChatMessage>>;
    getChatUserUID(name: string): Promise<string | null>;
    // Online
    onlineHeartbeat(displayName: string): Promise<bigint>;
    getOnlineUsers(): Promise<Array<OnlineUser>>;
    // Admin
    getAllRegisteredUsers(): Promise<Array<RegisteredUser>>;
    // UID
    getMyUID(): Promise<string | null>;
    getUserByUID(uid: string): Promise<[string, string] | null>;
    // Friends
    addFriend(uid: string): Promise<void>;
    removeFriend(uid: string): Promise<void>;
    getMyFriends(): Promise<Array<FriendEntry>>;
    // Comments
    addBuildComment(buildId: bigint, authorName: string, text: string): Promise<bigint>;
    addVoiceBuildComment(buildId: bigint, authorName: string, audioData: string): Promise<bigint>;
    getBuildComments(buildId: bigint): Promise<Array<BuildComment>>;
    deleteBuildComment(commentId: bigint): Promise<void>;
    // Votes
    toggleBuildLike(buildId: bigint): Promise<BuildVotes>;
    toggleBuildDislike(buildId: bigint): Promise<BuildVotes>;
    getBuildVotes(buildId: bigint): Promise<BuildVotes>;
    getMyVoteOnBuild(buildId: bigint): Promise<boolean | null>;
    // Top lists
    getTopBuilds(limit: bigint): Promise<Array<Build>>;
    getTopAuthors(limit: bigint): Promise<Array<TopAuthor>>;
}
