import { Response } from "../../utilities/helpers";
import moment from 'moment';

// MUTATIONS
const Mutations = {
	async logOrderActivitySave(root, { input }, context) {
		const knex = context.knex;

		input.accountId = context.Account.accountId;
		input.loggedInUserId = context.Session.LoggedIn === true ? context.Session.User.userId : 0;

		await knex("logOrderActivities").insert(input);

		return Response(true, "Log successfully created", { LogOrderActivity: input } );
	}
}

// QUERIES
const RootResolvers = {
	async LogOrderActivities(root, {userId=0, dateEnd='', dateStart='', limit='NULL'}, context) {
		// Defaulting LIMIT to NULL breaks the .limit and ignores it.
		const knex = context.knex;
		console.log({limit})
		return await knex('logOrderActivities')
			.where('accountId', context.Account.accountId)
			.andWhere(function() {
				if(dateEnd !== '') {
					this.where('dateCreated', '<=', moment(dateEnd).format('YYYY-MM-DD'))
				} else {
					this.where('logOrderActivityId', '>', 0) // This is just an option to return all results
				}
			})
			.andWhere(function() {
				if(dateStart !== '') {
					this.where('dateCreated', '>=', moment(dateStart).format('YYYY-MM-DD'))
				} else {
					this.where('logOrderActivityId', '>', 0) // This is just an option to return all results
				}
			})
			.andWhere(function() {
				if(userId > 0) {
					this.where('loggedInUserId', userId)
				} else {
					this.where('logOrderActivityId', '>', 0) // This is just an option to return all results
				}
			})
			.orderBy('dateCreated', 'desc')
			.limit(limit);
	},

	// Get the logs of Orders that are not cremated yet
	async LogOrderActivitiesAtCrematory(root, {orderQueue}, context) {
		const knex = context.knex;

		// This resolver is called from all of the /workflows/lists so we only need to return something for certain lists
		if(orderQueue === 'cremation_prioritization') {
			return await knex('logOrderActivities')
				.select('logOrderActivities.*')
				.where('logOrderActivities.accountId', context.Account.accountId)
				.whereNotIn('logOrderActivities.orderId', function() {
						this.select('orderId')
							.from('cremations')
							.distinct()
					})
				.whereNotIn('logOrderActivities.orderId', function() {
					this.select('orderId')
						.from('orders')
						.where('orderStatusId', 6)
				})
				// .andWhereNot('cremations.orderId', '>', 0)
				// .andWhere(function() {
				// 	if(dateEnd !== '') {
				// 		this.where('dateCreated', '<=', moment(dateEnd).format('YYYY-MM-DD'))
				// 	} else {
				// 		this.where('logOrderActivityId', '>', 0) // This is just an option to return all results
				// 	}
				// })
				// .andWhere(function() {
				// 	if(dateStart !== '') {
				// 		this.where('dateCreated', '>=', moment(dateStart).format('YYYY-MM-DD'))
				// 	} else {
				// 		this.where('logOrderActivityId', '>', 0) // This is just an option to return all results
				// 	}
				// })
				// .andWhere(function() {
				// 	if(userId > 0) {
				// 		this.where('loggedInUserId', userId)
				// 	} else {
				// 		this.where('logOrderActivityId', '>', 0) // This is just an option to return all results
				// 	}
				// })
				// .orderBy('dateCreated', 'desc')
				.orderBy('logOrderActivities.orderId');
		} else {
			return await knex('logOrderActivities').where('logOrderActivityId', 0);
		}
	},

	async LogOrderActivitiesDistinctColumnValues(root, {columnName}, context) {
		const knex = context.knex;

		const DistinctValues = await knex('logOrderActivities')
			.distinct(columnName)
			.where('accountId', context.Account.accountId)
			.andWhere(function() {
				this.where('dbTable', 'orders')
				this.orWhere('dbTable', 'ordersProducts')
			});

		console.log({DistinctValues})
		return DistinctValues;
	}
}



// EXPORT
export { Mutations, RootResolvers }
