
// main User types and inputs to be exported
export default `
	type UserPermission {
		userPermissionId: ID
		userId: ID
		Permission: Permission
		permissionLevel: Int
		permissionLevelString: String
		defaultPermissionLevel: Int
	}

	type UserPermissionSaveResponse {
		Response: Response
		UserPermission: UserPermission
	}

	input UserPermissionInput {
		userPermissionId: ID
		userId: ID!
		permissionId: ID!
		permissionLevel: Int!
	}

	extend type RootMutation {
		userPermissionSave(input: UserPermissionInput!): UserPermissionSaveResponse!
	}
`;

