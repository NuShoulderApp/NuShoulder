import { Response } from "../../utilities/helpers";
import _ from "lodash";

const OrderCommentMutations = {
	// input is a Order object with the data to insert or update
	async orderCommentSave(root, { input }, context) {
		const knex = context.knex;
		console.log({input})
		const { 
			orderComment='', 
			orderCommentId=0, 
			orderCommentInternal=1,
			orderCommentMadeBy='',
			orderCommentStatus='unread',
			orderCommentType='',
			orderId
		} = input;

		if(orderCommentId > 0 && orderCommentType === 'Follow-up Call') {
			console.log('call ended')
			await knex('ordersComments')
				.where({ orderCommentId })
				.update({dateEnded: knex.fn.now(), orderComment, orderCommentStatus});
		}
		else if(orderCommentId > 0 && orderCommentStatus !== '') {
			const currentComment = await knex('ordersComments')
				.where({ orderCommentId })
				.first();

			// const currentUser = await knex('ordersComments')
			// 	.where({ orderCommentId })
			// 	.first();

			await knex('ordersComments')
				.where({ orderCommentId })
				.update({orderCommentStatus});

			// log the change in status for the comment
			await knex('logOrderActivities').insert({
				accountId: context.Account.accountId,
				activity: "'" + currentComment.orderComment + "' Comment Status changed from '" + _.startCase(currentComment.orderCommentStatus) + "' to '" + _.startCase(orderCommentStatus) + "' by " + context.Session.User.firstName + " " + context.Session.User.lastName,
				activityType: "Order Comment Status Updated",
				dbField: "orderCommentStatus",
				dbTable: "ordersComments",
				loggedInUserId: context.Session.User.userId,
				orderId: currentComment.orderId,
				showVet: 0,
				userInitials: input.userInitials,
				valueNew: orderCommentStatus,
				valueOld: currentComment.orderCommentStatus
			});
		} else if(parseInt(orderCommentId) === 0) {
			// Insert a comment into the ordersComments table if there is a comment
			if(context.Session.LoggedIn === true) {
				const [newOrderCommentId] = await knex('ordersComments')
					.insert({
						orderId, 
						orderComment, 
						orderCommentInternal, 
						orderCommentMadeBy, 
						orderCommentStatus,
						orderCommentType, 
						userId: context.Session.User.userId
					});

				// Check if this comment was made in the Order Details Memorialization section - Bypassing the Payment Requirement - Log it if so.
				if(orderComment.includes("BYPASS PAYMENT REQUIREMENT")) {
					await knex('logOrderActivities').insert({
						accountId: context.Account.accountId,
						activity: "PAYMENT REQUIREMENT BYPASSED by " + context.Session.User.firstName + " " + context.Session.User.lastName,
						activityType: "Order Comment",
						dbField: "orderComment",
						dbTable: "ordersComments",
						loggedInUserId: context.Session.User.userId,
						orderId: orderId,
						showVet: 0,
						userInitials: null,
						valueNew: null,
						valueOld: null
					});
				}
				return Response(true,"Comment Saved", {OrderComment: {orderCommentId: newOrderCommentId} });
			}
		}
	}
}

// EXPORT
export { OrderCommentMutations as Mutations }
