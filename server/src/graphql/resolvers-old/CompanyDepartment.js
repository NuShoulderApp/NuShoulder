import { Response } from "../../utilities/helpers";

const CompanyDepartmentSubResolvers = {
	
}

// QUERIES
const CompanyDepartmentRootResolvers = {
	// Get CompanyDepartment - gets an array and then returns the .first() entry
	async CompanyDepartment(root, { companyDepartmentId }, context) {
		const knex = context.knex;

		// Return all addresses is going to be used in the order details for getting the list of potential delivery locations. This will only be used for crematory users though.
		if(companyDepartmentId > 0) {
			return await knex('companiesDepartments')
				.where('companiesDepartments.companyDepartmentId', companyDepartmentId)
				.first();
		} else {
			return null;
		}
	},

	// Get CompanyDepartments - gets an array and then returns all of the entries
	async CompanyDepartments(root, { companyId, userId }, context) {
		const knex = context.knex;

		// Return all addresses is going to be used in the order details for getting the list of potential delivery locations. This will only be used for crematory users though.
		if(companyId > 0) {
			return await knex('companiesDepartments')
				.join('companies', 'companies.companyId', 'companiesDepartments.companyId')
				.where('companiesDepartments.companyId', companyId)
				.andWhere('companies.active', 1)
				.andWhere('companiesDepartments.active', 1);
		} else if(userId > 0) {
			return await knex('companiesDepartments')
				.join("users", "companiesDepartments.companyId", "users.companyId")
				.where({ userId })
				.andWhere('companiesDepartments.active', 1);
		}
	}
}

// MUTATIONS
const CompanyDepartmentMutations = {
	// input is an object with the data to insert or update
	// Insert into CompaniesDepartments
	async companyDepartmentSave(root, { input }, context) {
		const knex = context.knex;

		let {
			companyDepartmentId,
			active,
			companyId,
			departmentName
		} = input;

		input = { ...input };

		// if there is a companyDepartmentId > 0, do an update, otherwise do an insert.
		if( companyDepartmentId > 0 ) {
			// The route is changing, we will update it and the stop order.
			await knex('companiesDepartments')
				.where({ companyDepartmentId })
				.update({
					active,
					companyId,
					departmentName
				});

			return Response(true, "Department successfully saved", { CompanyDepartment: input });
		} else {
			const [companyDepartmentId] = await knex('companiesDepartments').insert(
				{
					active,
					companyId,
					departmentName
				}
			);

			return Response(true, "Department successfully created", { CompanyDepartment: {...input, companyDepartmentId} } );
		}
	},
	async companyDepartmentRemove( root, { companyDepartmentId }, context ) {
		const knex = context.knex;

		if ( companyDepartmentId ) {
			// Run the multiple deletes in a transaction.
			const removed = await knex.transaction(async (trx) => {
				// Get the addressId from the linked user address.
				const { companyDepartmentId } = await trx("companiesDepartments").select("companyDepartmentId").first().where({ companyDepartmentId });

				// Delete the users phone record.
				const companyDepartmentRemoved = await trx("companiesDepartments").delete().where({ companyDepartmentId });

				return companyDepartmentRemoved;
			});

			if( removed ) {
				return Response(true,"Company Department removed");
			} else {
				return Response(false,"Company Department not found, could not be removed");
			}
		} else {
			return Response(false,"Company Department could not be removed");
		}
	}
}

// EXPORT
export { CompanyDepartmentSubResolvers, CompanyDepartmentMutations, CompanyDepartmentRootResolvers }
