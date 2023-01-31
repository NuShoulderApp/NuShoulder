// QUERIES

const SubResolvers = {
	// resolve signatureId
	async Signature(root, args, context) {
		let { signatureId=0 } = root;

		// if we don't have signatureId, return null
		if (!signatureId) {
			return null;
		}

		// if we already have data, return it
		if (root.signatureName) {
			return root;
		}

		let accountId = context.Account.accountId;

		return await context.knex('signatures')
			.where({signatureId, accountId})
			.first();
	}
}

const Mutations = {
	// Save signature data into signatures table and return signature object
	async saveSignature(root, args, context) {
		// TODO: args validation

		let {
			signatureInput={},
			//userId
		} = args;

		// get userId from context.Session.User.userId, default to 0
		let userId = (((context || {}).Session || {}).User || {}).userId || 0;

		let [signatureId] = await context.knex('signatures').insert({
			...signatureInput,
			collectedByUserId: userId,
			accountId: context.Account.accountId
		});

		return { signatureId };
	}
}


// EXPORT
export { Mutations, SubResolvers }
