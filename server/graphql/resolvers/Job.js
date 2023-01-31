import { enqueueMessage } from "../../utilities/RabbitMQ";
import { Mutations as PrintableLogMutations } from "./PrintableLog";

const SubResolvers = {
	// OPTIONAL: get linked items in subresolvers
	async File({ fileId }, args, context) {
		return await context.knex("files").where('files.fileId', fileId).first();
	}
}

// QUERIES
const RootResolvers = {
	async Job(root, { deliveryLogId=0, invoiceId=0, jobId, orderId=0, orderProductId=0, printableName='' }, context) {
		const knex = context.knex;
		let Job = null;

		// if we have a jobId look that up, else if we have an order and printable Id then create a new job for that
		if(jobId !== null && jobId > 0) {
			Job = await knex('jobs')
				.where({'accountId': context.Account.accountId, 'jobId': jobId}).first();
		} else if (orderId !== null && orderId > 0 && printableName !== null && printableName !== '') {
			///// IMPORTANT ///////////////// IMPORTANT ////////////// IMPORTANT ////////////////// IMPORTANT ///////////////////// IMPORTANT ////////////////
			// ANY CHANGES MADE HERE ALSO NEED TO BE MADE IN THE MUTATIONS BELOW
			///// IMPORTANT ///////////////// IMPORTANT ////////////// IMPORTANT ////////////////// IMPORTANT ///////////////////// IMPORTANT ////////////////


			// check if we already have a printablesOrders entry - if not then create the job, the worker will create the printablesOrders entry later
			let [printable] = await knex('printables')
				.join('printablesAccounts', 'printablesAccounts.printableId', 'printables.printableId')
				.where('printables.printableName', printableName)
				.andWhere('printablesAccounts.accountId', context.Account.accountId);

			let printableOrder = await knex('printablesOrders')
				.where({'accountId': context.Account.accountId, 'orderId': orderId, 'printableId': printable.printableId}).first();

			// IF not caching and we have a printable check for the filId so we can find the existing Job to return check if there is already a job for the file if
			if(printable.allowCache === 1 && printableOrder !== null) {
				// check for a job with the fileId from the printableOrder
				Job = knex('jobs').where({'accountId': context.Account.accountId, fileId: printableOrder.fileId}).first();
			}
			// if no caching or haven't yet created the printable for this order then create a job to make it
			if (printableOrder === null || printable.allowCache === 0) {
				// Create the Tag for the Cremation
				const payload = JSON.stringify({
					template: printable.printableTemplate,
					orderId: orderId,
					orderProductId: orderProductId
				});
				// create job in the db to track progress
				[jobId] = await knex("jobs").insert({
					accountId: context.Account.accountId,
					payload,
					queue: "pdf",
					status: "pending"
				});

				// Making the file and folder naming system as generic as possible
				let sectionTypeId = ''; // This will be the integer for orderId, invoiceId, etc.
				if(orderId > 0) {
					sectionTypeId = orderId;
				} else if(invoiceId > 0) {
					sectionTypeId = invoiceId;
				} else if(deliveryLogId > 0) {
					sectionTypeId = deliveryLogId;
				}
				const fileName = `${sectionTypeId}_${printable.printableTemplate}.pdf`;
				const folder = printable.printableName;

				// Use the headers tp send in the account URL so the worker can get the proper context.
				await enqueueMessage("pdf", payload, { appId: String(jobId), headers: { filename: fileName, folder: folder, accountId: String(context.Account.accountId), url: context.Account.url  } } );

				///// IMPORTANT ///////////////// IMPORTANT ////////////// IMPORTANT ////////////////// IMPORTANT ///////////////////// IMPORTANT ////////////////
				// ANY CHANGES MADE HERE ALSO NEED TO BE MADE IN THE MUTATIONS BELOW
				///// IMPORTANT ///////////////// IMPORTANT ////////////// IMPORTANT ////////////////// IMPORTANT ///////////////////// IMPORTANT ////////////////

				// get job to return
				Job = await knex('jobs')
					.where({'accountId': context.Account.accountId, 'jobId': jobId}).first();

				// Log that this was printed
				await PrintableLogMutations.printableLogSave(root, { input: { fileId: Job.fileId, orderId, printableId: printable.printableId }}, context);

			}
		}
		return Job
	}
}

// MUTATIONS
const Mutations = {
	async generateJob(root, { input }, context) {
		const knex = context.knex;
		const { deliveryLogId=0, invoiceId=0, orderId, orderIds, orderProductId=0, printableName, sendEmail=false } = input;

		let Job = null;

		///// IMPORTANT ///////////////// IMPORTANT ////////////// IMPORTANT ////////////////// IMPORTANT ///////////////////// IMPORTANT ////////////////
		// ANY CHANGES MADE HERE ALSO NEED TO BE MADE IN THE ROOTRESOLVER ABOVE
		///// IMPORTANT ///////////////// IMPORTANT ////////////// IMPORTANT ////////////////// IMPORTANT ///////////////////// IMPORTANT ////////////////
		// check if we already have a printablesOrders entry - if not then create the job, the worker will create the printablesOrders entry later
		let [printable] = await knex('printables')
			.join('printablesAccounts', 'printablesAccounts.printableId', 'printables.printableId')
			.where('printables.printableName', printableName)
			.andWhere('printablesAccounts.accountId', context.Account.accountId);

		let printableOrder = await knex('printablesOrders')
			.where({'accountId': context.Account.accountId, 'orderId': orderId, 'printableId': printable.printableId}).first();

		// IF not caching and we have a printable check for the filId so we can find the existing Job to return check if there is already a job for the file if
		if(printable.allowCache === 1 && printableOrder !== null) {
			// check for a job with the fileId from the printableOrder
			Job = knex('jobs').where({'accountId': context.Account.accountId, fileId: printableOrder.fileId}).first();
		}

		// if no caching or haven't yet created the printable for this order then create a job to make it
		if (printableOrder === null || printable.allowCache === 0) {
			// Create the Tag for the Cremation
			const payload = JSON.stringify({
				deliveryLogId: deliveryLogId,
				invoiceId: invoiceId,
				orderId: orderId,
				orderIds: orderIds,
				orderProductId: orderProductId,
				printableName: printableName,
				sendEmail: sendEmail,
				template: printable.printableTemplate
			});
			// create job in the db to track progress
			const [newJobId] = await knex("jobs").insert({
				accountId: context.Account.accountId,
				payload,
				queue: "pdf",
				status: "pending"
			});

			// Making the file and folder naming system as generic as possible
			let sectionTypeId = ''; // This will be the integer for orderId, invoiceId, etc.
			if(orderId > 0) {
				sectionTypeId = orderId;
			} else if(invoiceId > 0) {
				sectionTypeId = invoiceId;
			} else if(deliveryLogId > 0) {
				sectionTypeId = deliveryLogId;
			}

			const fileName = `${sectionTypeId}_${printable.printableTemplate}.pdf`;
			const folder = printable.printableName;

			// if(printable.printableTemplate === "certificateOfCremation") {
			// } else if(printable.printableTemplate === "cremationTag") {
			// 	fileName = `${orderId}_order_cremation_tag.pdf`;
			// 	folder = 'cremationTags';
			// } else if(printable.printableTemplate === "packingSlip") {
			// 	fileName = `${orderId}_order_packing_slip.pdf`;
			// 	folder = 'packingSlips';
			// } else if(printable.printableTemplate === "orderStickers") {
			// 	fileName = `${orderId}_order_stickers.pdf`;
			// 	folder = 'orderStickers';
			// } else if(printable.printableTemplate === "orderProductStickers") {
			// 	fileName = `${orderId}_order_product_stickers.pdf`;
			// 	folder = 'orderProductStickers';
			// } else if(printable.printableTemplate === "walkInOrderReceipt") {
			// 	fileName = `${orderId}_order_walk_in_receipt.pdf`;
			// 	folder = 'walkInOrderReceipts';
			// }

			// Use the headers tp send in the account URL so the worker can get the proper context.
			await enqueueMessage("pdf", payload, { appId: String(newJobId), headers: { filename: fileName, folder: folder, accountId: String(context.Account.accountId), url: context.Account.url  } } );

			// get job to return
			Job = await knex('jobs')
				.where({'accountId': context.Account.accountId, 'jobId': newJobId}).first();

			// Log that this was printed
			await PrintableLogMutations.printableLogSave(root, { input: { fileId: Job.fileId, orderId, printableId: printable.printableId }}, context);

		}
		///// IMPORTANT ///////////////// IMPORTANT ////////////// IMPORTANT ////////////////// IMPORTANT ///////////////////// IMPORTANT ////////////////
		// ANY CHANGES MADE HERE ALSO NEED TO BE MADE IN THE ROOTRESOLVER ABOVE
		///// IMPORTANT ///////////////// IMPORTANT ////////////// IMPORTANT ////////////////// IMPORTANT ///////////////////// IMPORTANT ////////////////

		// Need to sent the printableId back in the Job for use in the printablesLog
		Job.printableId = printable.printableId;
		return {Job};
	}
}

// EXPORT
export { Mutations, RootResolvers, SubResolvers }
