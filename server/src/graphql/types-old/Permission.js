// main User types and inputs to be exported
export default `
	type Permission {
		permissionId: Int
		permission: String
		description: String
		permissionDefaults(userTypeId: ID): [PermissionDefault]
	}

	extend type RootQuery {
		Permission(permissionId: ID!): Permission
		Permissions: [Permission]
	}
`;