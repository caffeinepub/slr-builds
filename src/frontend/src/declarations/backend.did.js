/* eslint-disable */
// @ts-nocheck
import { IDL } from '@icp-sdk/core/candid';

export const Branch = IDL.Record({ 'id': IDL.Nat, 'name': IDL.Text, 'imageUrl': IDL.Text });
export const Hero = IDL.Record({ 'id': IDL.Nat, 'name': IDL.Text, 'tier': IDL.Text, 'imageUrl': IDL.Text });
export const Item = IDL.Record({ 'id': IDL.Nat, 'name': IDL.Text, 'imageUrl': IDL.Text });
export const Skill = IDL.Record({ 'id': IDL.Nat, 'name': IDL.Text, 'imageUrl': IDL.Text, 'rarity': IDL.Text });
export const UserRole = IDL.Variant({ 'admin': IDL.Null, 'user': IDL.Null, 'guest': IDL.Null });
export const Build = IDL.Record({
  'id': IDL.Nat, 'costRare': IDL.Nat, 'heroIds': IDL.Vec(IDL.Nat), 'authorId': IDL.Principal,
  'hint': IDL.Text, 'requiredSkillIds': IDL.Vec(IDL.Nat), 'name': IDL.Text, 'createdAt': IDL.Int,
  'costLegendary': IDL.Nat, 'costBasic': IDL.Nat, 'isPublic': IDL.Bool, 'rounds': IDL.Nat,
  'forbiddenSkillIds': IDL.Vec(IDL.Nat),
});
export const RecordedBuild = IDL.Record({
  'id': IDL.Nat, 'heroId': IDL.Nat, 'title': IDL.Text, 'authorId': IDL.Principal, 'createdAt': IDL.Int,
});
export const UserProfile = IDL.Record({ 'name': IDL.Text });
export const RegisteredUser = IDL.Record({ 'principal': IDL.Principal, 'name': IDL.Text, 'uid': IDL.Text, 'registeredAt': IDL.Int });
export const ChatMessage = IDL.Record({ 'id': IDL.Nat, 'authorName': IDL.Text, 'text': IDL.Text, 'createdAt': IDL.Int });
export const OnlineUser = IDL.Record({ 'displayName': IDL.Text, 'lastSeen': IDL.Int });
export const BuildComment = IDL.Record({
  'id': IDL.Nat, 'buildId': IDL.Nat, 'authorId': IDL.Principal,
  'authorName': IDL.Text, 'text': IDL.Text, 'createdAt': IDL.Int,
});
export const BuildVotes = IDL.Record({ 'likes': IDL.Nat, 'dislikes': IDL.Nat });
export const FriendEntry = IDL.Record({ 'uid': IDL.Text, 'name': IDL.Text });
export const TopAuthor = IDL.Record({ 'authorId': IDL.Principal, 'authorName': IDL.Text, 'totalLikes': IDL.Nat });

const serviceEntries = {
  '_initializeAccessControlWithSecret': IDL.Func([IDL.Text], [], []),
  'addBranch': IDL.Func([Branch], [IDL.Nat], []),
  'addHero': IDL.Func([Hero], [IDL.Nat], []),
  'addItem': IDL.Func([Item], [IDL.Nat], []),
  'addSkill': IDL.Func([Skill], [IDL.Nat], []),
  'assignCallerUserRole': IDL.Func([IDL.Principal, UserRole], [], []),
  'countPublicBuildsBySkill': IDL.Func([IDL.Nat], [IDL.Nat], ['query']),
  'createBuild': IDL.Func([Build], [IDL.Nat], []),
  'createRecordedBuild': IDL.Func([RecordedBuild], [IDL.Nat], []),
  'deleteAllTierLists': IDL.Func([], [], []),
  'deleteBranch': IDL.Func([IDL.Nat], [], []),
  'deleteBuildById': IDL.Func([IDL.Nat], [], []),
  'deleteHero': IDL.Func([IDL.Nat], [], []),
  'deleteItem': IDL.Func([IDL.Nat], [], []),
  'deleteMyTierList': IDL.Func([], [], []),
  'deleteRecordedBuild': IDL.Func([IDL.Nat], [], []),
  'deleteSkill': IDL.Func([IDL.Nat], [], []),
  'getAllBranches': IDL.Func([], [IDL.Vec(Branch)], ['query']),
  'getAllHeroes': IDL.Func([], [IDL.Vec(Hero)], ['query']),
  'getAllItems': IDL.Func([], [IDL.Vec(Item)], ['query']),
  'getAllSkills': IDL.Func([], [IDL.Vec(Skill)], ['query']),
  'getCallerUserProfile': IDL.Func([], [IDL.Opt(UserProfile)], ['query']),
  'getCallerUserRole': IDL.Func([], [UserRole], ['query']),
  'getMyBuilds': IDL.Func([], [IDL.Vec(Build)], ['query']),
  'getMyRecordedBuilds': IDL.Func([], [IDL.Vec(RecordedBuild)], ['query']),
  'getPublicBuilds': IDL.Func([], [IDL.Vec(Build)], ['query']),
  'getPublicBuildsExcludingSkills': IDL.Func([IDL.Vec(IDL.Nat)], [IDL.Vec(Build)], ['query']),
  'getRecordedBuildsByHero': IDL.Func([IDL.Nat], [IDL.Vec(RecordedBuild)], ['query']),
  'getTierList': IDL.Func([IDL.Principal], [IDL.Opt(IDL.Text)], ['query']),
  'getUserProfile': IDL.Func([IDL.Principal], [IDL.Opt(UserProfile)], ['query']),
  'isCallerAdmin': IDL.Func([], [IDL.Bool], ['query']),
  'saveCallerUserProfile': IDL.Func([UserProfile], [], []),
  'saveTierList': IDL.Func([IDL.Text], [], []),
  // Seed functions - split to avoid ICP instruction limit
  'seedTestData': IDL.Func([], [], []),
  'seedSkillsAndBranches': IDL.Func([], [], []),
  'seedHeroes': IDL.Func([], [], []),
  'seedItems': IDL.Func([], [], []),
  'seedBuilds': IDL.Func([], [], []),
  'toggleBuildVisibility': IDL.Func([IDL.Nat], [], []),
  'updateBranch': IDL.Func([Branch], [], []),
  'updateBuild': IDL.Func([Build], [], []),
  'updateHero': IDL.Func([Hero], [], []),
  'updateItem': IDL.Func([Item], [], []),
  'updateSkill': IDL.Func([Skill], [], []),
  // Chat
  'sendChatMessage': IDL.Func([IDL.Text, IDL.Text, IDL.Text], [IDL.Nat], []),
  'sendVoiceChatMessage': IDL.Func([IDL.Text, IDL.Text, IDL.Text], [IDL.Nat], []),
  'getChatMessages': IDL.Func([], [IDL.Vec(ChatMessage)], ['query']),
  'getChatUserUID': IDL.Func([IDL.Text], [IDL.Opt(IDL.Text)], ['query']),
  // Online
  'onlineHeartbeat': IDL.Func([IDL.Text], [IDL.Nat], []),
  'getOnlineUsers': IDL.Func([], [IDL.Vec(OnlineUser)], ['query']),
  // Admin
  'getAllRegisteredUsers': IDL.Func([], [IDL.Vec(RegisteredUser)], ['query']),
  // UID
  'getMyUID': IDL.Func([], [IDL.Opt(IDL.Text)], ['query']),
  'getUserByUID': IDL.Func([IDL.Text], [IDL.Opt(IDL.Tuple(IDL.Text, IDL.Text))], ['query']),
  // Friends
  'addFriend': IDL.Func([IDL.Text], [], []),
  'removeFriend': IDL.Func([IDL.Text], [], []),
  'getMyFriends': IDL.Func([], [IDL.Vec(FriendEntry)], ['query']),
  // Comments
  'addBuildComment': IDL.Func([IDL.Nat, IDL.Text, IDL.Text], [IDL.Nat], []),
  'addVoiceBuildComment': IDL.Func([IDL.Nat, IDL.Text, IDL.Text], [IDL.Nat], []),
  'getBuildComments': IDL.Func([IDL.Nat], [IDL.Vec(BuildComment)], ['query']),
  'deleteBuildComment': IDL.Func([IDL.Nat], [], []),
  // Votes
  'toggleBuildLike': IDL.Func([IDL.Nat], [BuildVotes], []),
  'toggleBuildDislike': IDL.Func([IDL.Nat], [BuildVotes], []),
  'getBuildVotes': IDL.Func([IDL.Nat], [BuildVotes], ['query']),
  'getMyVoteOnBuild': IDL.Func([IDL.Nat], [IDL.Opt(IDL.Bool)], ['query']),
  // Admin moderation
  'deleteChatMessage': IDL.Func([IDL.Nat], [], []),
  'clearAllChat': IDL.Func([], [], []),
  'getAllBuildComments': IDL.Func([], [IDL.Vec(BuildComment)], ['query']),
  'adminDeleteBuildComment': IDL.Func([IDL.Nat], [], []),
  'adminDeleteBuild': IDL.Func([IDL.Nat], [], []),
  'getSiteStats': IDL.Func([], [IDL.Nat, IDL.Nat, IDL.Nat, IDL.Nat, IDL.Nat, IDL.Nat], ['query']),
  // Top lists
  'getTopBuilds': IDL.Func([IDL.Nat], [IDL.Vec(Build)], ['query']),
  'getTopAuthors': IDL.Func([IDL.Nat], [IDL.Vec(TopAuthor)], ['query']),
};

export const idlService = IDL.Service(serviceEntries);
export const idlInitArgs = [];
export const idlFactory = ({ IDL: _IDL }) => IDL.Service(serviceEntries);
export const init = ({ IDL: _IDL }) => [];
