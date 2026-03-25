import type { Principal } from '@dfinity/principal';
import type { ActorMethod } from '@dfinity/agent';
import type { IDL } from '@dfinity/candid';

export interface Branch { 'id': bigint, 'name': string, 'imageUrl': string }
export interface Hero { 'id': bigint, 'name': string, 'tier': string, 'imageUrl': string }
export interface Item { 'id': bigint, 'name': string, 'imageUrl': string }
export interface Skill { 'id': bigint, 'name': string, 'imageUrl': string, 'rarity': string }
export type UserRole = { 'admin': null } | { 'user': null } | { 'guest': null };
export interface Build {
  'id': bigint, 'costRare': bigint, 'heroIds': Array<bigint>, 'authorId': Principal,
  'hint': string, 'requiredSkillIds': Array<bigint>, 'name': string, 'createdAt': bigint,
  'costLegendary': bigint, 'costBasic': bigint, 'isPublic': boolean, 'rounds': bigint,
  'forbiddenSkillIds': Array<bigint>,
}
export interface RecordedBuild {
  'id': bigint, 'heroId': bigint, 'title': string, 'authorId': Principal, 'createdAt': bigint,
}
export interface UserProfile { 'name': string }
export interface RegisteredUser { 'principal': Principal, 'name': string, 'uid': string, 'registeredAt': bigint }
export interface ChatMessage { 'id': bigint, 'authorName': string, 'text': string, 'createdAt': bigint }
export interface OnlineUser { 'displayName': string, 'lastSeen': bigint }
export interface BuildComment {
  'id': bigint, 'buildId': bigint, 'authorId': Principal,
  'authorName': string, 'text': string, 'createdAt': bigint,
}
export interface BuildVotes { 'likes': bigint, 'dislikes': bigint }
export interface FriendEntry { 'uid': string, 'name': string }
export interface TopAuthor { 'authorId': Principal, 'authorName': string, 'totalLikes': bigint }

export interface _SERVICE {
  '_initializeAccessControlWithSecret': ActorMethod<[string], undefined>,
  'addBranch': ActorMethod<[Branch], bigint>,
  'addHero': ActorMethod<[Hero], bigint>,
  'addItem': ActorMethod<[Item], bigint>,
  'addSkill': ActorMethod<[Skill], bigint>,
  'assignCallerUserRole': ActorMethod<[Principal, UserRole], undefined>,
  'countPublicBuildsBySkill': ActorMethod<[bigint], bigint>,
  'createBuild': ActorMethod<[Build], bigint>,
  'createRecordedBuild': ActorMethod<[RecordedBuild], bigint>,
  'deleteAllTierLists': ActorMethod<[], undefined>,
  'deleteBranch': ActorMethod<[bigint], undefined>,
  'deleteBuildById': ActorMethod<[bigint], undefined>,
  'deleteHero': ActorMethod<[bigint], undefined>,
  'deleteItem': ActorMethod<[bigint], undefined>,
  'deleteMyTierList': ActorMethod<[], undefined>,
  'deleteRecordedBuild': ActorMethod<[bigint], undefined>,
  'deleteSkill': ActorMethod<[bigint], undefined>,
  'getAllBranches': ActorMethod<[], Array<Branch>>,
  'getAllHeroes': ActorMethod<[], Array<Hero>>,
  'getAllItems': ActorMethod<[], Array<Item>>,
  'getAllSkills': ActorMethod<[], Array<Skill>>,
  'getCallerUserProfile': ActorMethod<[], [] | [UserProfile]>,
  'getCallerUserRole': ActorMethod<[], UserRole>,
  'getMyBuilds': ActorMethod<[], Array<Build>>,
  'getMyRecordedBuilds': ActorMethod<[], Array<RecordedBuild>>,
  'getPublicBuilds': ActorMethod<[], Array<Build>>,
  'getPublicBuildsExcludingSkills': ActorMethod<[Array<bigint>], Array<Build>>,
  'getRecordedBuildsByHero': ActorMethod<[bigint], Array<RecordedBuild>>,
  'getTierList': ActorMethod<[Principal], [] | [string]>,
  'getUserProfile': ActorMethod<[Principal], [] | [UserProfile]>,
  'isCallerAdmin': ActorMethod<[], boolean>,
  'saveCallerUserProfile': ActorMethod<[UserProfile], undefined>,
  'saveTierList': ActorMethod<[string], undefined>,
  'seedTestData': ActorMethod<[], undefined>,
  'seedSkillsAndBranches': ActorMethod<[], undefined>,
  'seedHeroes': ActorMethod<[], undefined>,
  'seedItems': ActorMethod<[], undefined>,
  'seedBuilds': ActorMethod<[], undefined>,
  'toggleBuildVisibility': ActorMethod<[bigint], undefined>,
  'updateBranch': ActorMethod<[Branch], undefined>,
  'updateBuild': ActorMethod<[Build], undefined>,
  'updateHero': ActorMethod<[Hero], undefined>,
  'updateItem': ActorMethod<[Item], undefined>,
  'updateSkill': ActorMethod<[Skill], undefined>,
  'sendChatMessage': ActorMethod<[string, string], bigint>,
  'sendVoiceChatMessage': ActorMethod<[string, string], bigint>,
  'getChatMessages': ActorMethod<[], Array<ChatMessage>>,
  'onlineHeartbeat': ActorMethod<[string], bigint>,
  'getOnlineUsers': ActorMethod<[], Array<OnlineUser>>,
  'getAllRegisteredUsers': ActorMethod<[], Array<RegisteredUser>>,
  'getMyUID': ActorMethod<[], [] | [string]>,
  'getUserByUID': ActorMethod<[string], [] | [[string, string]]>,
  'addFriend': ActorMethod<[string], undefined>,
  'removeFriend': ActorMethod<[string], undefined>,
  'getMyFriends': ActorMethod<[], Array<FriendEntry>>,
  'addBuildComment': ActorMethod<[bigint, string, string], bigint>,
  'addVoiceBuildComment': ActorMethod<[bigint, string, string], bigint>,
  'getBuildComments': ActorMethod<[bigint], Array<BuildComment>>,
  'deleteBuildComment': ActorMethod<[bigint], undefined>,
  'toggleBuildLike': ActorMethod<[bigint], BuildVotes>,
  'toggleBuildDislike': ActorMethod<[bigint], BuildVotes>,
  'getBuildVotes': ActorMethod<[bigint], BuildVotes>,
  'getMyVoteOnBuild': ActorMethod<[bigint], [] | [boolean]>,
  'getTopBuilds': ActorMethod<[bigint], Array<Build>>,
  'getTopAuthors': ActorMethod<[bigint], Array<TopAuthor>>,
}
export declare const idlService: IDL.ServiceClass;
export declare const idlInitArgs: IDL.Type[];
export declare const idlFactory: IDL.InterfaceFactory;
export declare const init: (args: { IDL: typeof IDL }) => IDL.Type[];
