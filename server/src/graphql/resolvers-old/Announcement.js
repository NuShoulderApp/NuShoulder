// import _ from 'lodash';
// import { enqueueMessage } from "../../utilities/RabbitMQ";
// import moment from 'moment';
import { Response } from "../../utilities/helpers";

const AnnouncementSubResolvers = {
	// OPTIONAL: get linked items in subresolvers
	/*async UserCreated({ userIdCreated }, args, context) {
		return await context.knex("users").where('users.userId', userIdCreated).first();
	},
	async UserUpdated({ userIdUpdated }, args, context) {
		return await context.knex("users").where('users.userId', userIdUpdated).first();
	}*/
}

// QUERIES
const AnnouncementRootResolvers = {
	// Get Announcement - gets an array and then returns the .first() entry
	async Announcement(root, { announcementId} , context) {
		const knex = context.knex;

		let accountId = context.Account.accountId;

		return await knex('announcements')
			.where('announcements.accountId', accountId)
			.where('announcements.announcementId', announcementId)
			.first();
	},

	// Get Announcements
	async Announcements(root, { onlyActive=false, onlyCurrent=false }, context) {
		const knex = context.knex;

		return await knex('announcements')
			.where('announcements.accountId', context.Account.accountId)
			.andWhere(function() {
				if(onlyActive === true) {
					this.where('announcements.active', 1)
				}
				if(onlyCurrent === true) {
					this.where('announcements.dateStart', '<=', knex.fn.now())
					this.where('announcements.dateEnd', '>=', knex.fn.now())
				}
			})
			.orderBy('announcements.dateStart', 'ASC')
			.orderBy('announcements.dateEnd', 'ASC');
	}
}

// MUTATIONS
const Mutations = {
	// input is an object with the data to insert or update
	// Insert into cremations table
	async AnnouncementSave(root, { input }, context) {
		if(context.Session.User.userTypeId === 2 || context.Session.User.userTypeId === 3) {
			const knex = context.knex;

			const {
				active,
				announcement,
				announcementId,
				dateEnd,
				dateStart,
				title
			} = input;

			let accountId = context.Account.accountId;
			input = { ...input, accountId };

			let Announcement = {};
			let Announcements = {};
			if(announcementId > 0) {
				await knex('announcements')
					.where({ announcementId })
					.update({ active, announcement, dateEnd, dateStart, dateUpdated: knex.fn.now(), title, userIdUpdated: context.Session.User.userId });

				Announcement = await knex('announcements')
					.where('announcements.accountId', accountId)
					.where('announcements.announcementId', announcementId)
					.first();
				Announcements = await knex('announcements')
					.where('announcements.accountId', context.Account.accountId)
					.orderBy('announcements.dateStart', 'ASC')
					.orderBy('announcements.dateEnd', 'ASC');
				return Response(true, "Announcement successfully saved", { Announcement: Announcement, Announcements: Announcements });

			} else {
				// We add await here so that the system will wait until the promise resolves before proceeding to the next line assign the result to a single var for use below.
				const [announcementId] = await knex('announcements').insert({ accountId, active, announcement, dateEnd, dateStart, dateCreated: knex.fn.now(), title, userIdCreated: context.Session.User.userId });
				Announcement = await knex('announcements')
					.where('announcements.accountId', accountId)
					.where('announcements.announcementId', announcementId)
					.first();
				Announcements = await knex('announcements')
					.where('announcements.accountId', context.Account.accountId)
					.orderBy('announcements.dateStart', 'ASC')
					.orderBy('announcements.dateEnd', 'ASC');
				return Response(true, "Announcement successfully created", { Announcement: Announcement, Announcements: Announcements } );
			}

		} else {
			return Response(false,"Please Login as Crematory Staff", { Cremation: {} });
		}
	}
}

// EXPORT
export { AnnouncementSubResolvers, Mutations, AnnouncementRootResolvers }
