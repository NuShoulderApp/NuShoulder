import { Response } from "../../utilities/helpers";

const SubResolvers = {
	// OPTIONAL: get linked items in subresolvers

}

// QUERIES
const RootResolvers = {
	// Get Machine - gets an array and then returns the .first() entry
	async Machine(root, { machineId }, context) {
		const knex = context.knex;
		let accountId = context.Account.accountId;

		return await knex('machines')
			.where('machines.accountId', accountId)
			.andWhere('machines.machineId', machineId)
			.first();
	},

	// Get Machines, given a accountId and optionaly an active flag, get all the machines on that account
	async Machines(root, { active=1 }, context) {
		const knex = context.knex;
		let accountId = context.Account.accountId;
		let machines = {};

		if(accountId > 0 && active === null) {
			machines = await knex.select('machines.*', 'cremationLogs.cremationLogId')
				.from('machines')
				.where('machines.accountId', accountId)
				.leftOuterJoin('cremationLogs', 'machines.machineId', '=', 'cremationLogs.machineId')
				.where({ 'cremationLogs.dateCremationLogEnd': null });
			return machines;
		} else if(accountId > 0 && active !== null) {
			machines = await knex.select('machines.*', 'cremationLogs.cremationLogId')
				.from('machines')
				.where('machines.accountId', accountId)
				.andWhere('machines.active', active)
				.leftOuterJoin('cremationLogs', function() {
					this.on('machines.machineId', '=', 'cremationLogs.machineId')
						.onNull('cremationLogs.dateCremationLogEnd')
				});
			return machines;
		} 
	}
}

// MUTATIONS
const Mutations = {
	// input is an object with the data to insert or update
	// Insert into machines table
	async MachineSave(root, { input }, context) {
		if(context.Session.User.userTypeId === 2) {
			const knex = context.knex;

			const {
				active,
				columns,
				doCommunal,
				doIndividual,
				doPrivate,
				isMultiChamber,
				machineId,
				machineName,
				rows
			} = input;

			let accountId = context.Account.accountId;
			input = { ...input, accountId };
			// if there is a machineId > 0, do an update, otherwise do an insert.
			if(machineId > 0) {
				await knex('machines')
					.where({ machineId })
					.update({ active, columns, doCommunal, doIndividual, doPrivate, isMultiChamber, machineName, rows });
				return Response(true, "Machine successfully saved", { Machine: input });
			} else {
				// We add await here so that the system will wait until the promise resolves before proceeding to the next line assign the result to a single var for use below.
				const [machineId] = await knex('machines').insert({ accountId, active, columns, doCommunal, doIndividual, doPrivate, isMultiChamber, machineName, rows });
				const Machines = await knex.select('machines.*', 'cremationLogs.cremationLogId')
					.from('machines')
					.where('machines.accountId', accountId)
					.andWhere('machines.active', 1)
					.leftOuterJoin('cremationLogs', function() {
						this.on('machines.machineId', '=', 'cremationLogs.machineId')
							.onNull('cremationLogs.dateCremationLogEnd')
					});
				return Response(true, "Machine successfully created", { Machine: {...input, machineId}, Machines: Machines } );
			}
		} else {
			return Response(false,"Please Login as a Crematory Admin", { Machine: {} });
		}
	},
	async MachineRemove( root, { machineId }, context ) {
		if(context.Session.User.userTypeId === 2) {
			const knex = context.knex;

			if ( machineId ) {
				// Run the multiple deletes in a transaction.
				const removed = await knex.transaction(async (trx) => {
					const machineRemoved = await trx("machines").delete().where({ machineId });
					return machineRemoved;
				});

				if( removed ) {
					return Response(true,"Machine removed");
				} else {
					return Response(false,"Machine not found, could not be removed");
				}
			} else {
				return Response(false,"Machine could not be removed");
			}
		} else {
			return Response(false,"Please Login as a Crematory Admin", { Machine: {} });
		}
	}
}

// EXPORT
export { SubResolvers, Mutations, RootResolvers }
