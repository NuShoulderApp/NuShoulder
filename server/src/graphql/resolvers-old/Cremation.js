import _ from 'lodash';
import { enqueueMessage } from "../../utilities/RabbitMQ";
import moment from 'moment';
import { Response } from "../../utilities/helpers";

const CremationSubResolvers = {
	// OPTIONAL: get linked items in subresolvers
	async Order({ orderId }, args, context) {
		return await context.knex("orders")
			.select('orders.*', 'companies.companyName', 'species.*')
			.join("companies", "companies.companyId", "orders.companyId")
			.join("species", "species.speciesId", "orders.speciesId")
			.where('orders.orderId', orderId).first();
	},
	async UserEnd({ userIdEnd }, args, context) {
		return await context.knex("users").where('users.userId', userIdEnd).first();
	},
	async UserStart({ userIdStart }, args, context) {
		return await context.knex("users").where('users.userId', userIdStart).first();
	}
}

// QUERIES
const CremationRootResolvers = {
	// Get Cremation - gets an array and then returns the .first() entry
	async Cremation(root, { cremationId }, context) {
		const knex = context.knex;

		return await knex('cremations')
			.where('cremations.cremationId', cremationId)
			.first();
	},

	// Get the cremation information needed for the order details
	async CremationOrderDetails(root, {orderId}, context) {
		const knex = context.knex;

		let [cremations] =  await knex('cremations')
			.select('cremations.*', 'machines.*', 'users.firstName', 'users.lastName')
			.join('cremationLogs', 'cremationLogs.cremationLogId', 'cremations.cremationLogId')
			.join('machines', 'machines.machineId', 'cremationLogs.machineId')
			.join('users', 'users.userId', 'cremationLogs.performedByUserId')
			.where('cremations.orderId', orderId);

		return cremations
	},

	// Get Cremations, given a cremationLogId, get all the cremations on that log
	async Cremations(root, { cremationLogId, onlyOpenCremations=false }, context) {
		const knex = context.knex;
		if(cremationLogId > 0) {
			return await knex('cremations')
				.where('cremations.cremationLogId', cremationLogId)
				.andWhere(function() {
					if(onlyOpenCremations === true) {
						this.whereNull('dateCremationEnd')
					} else {
						// This is just a placehold that will return all results
						this.whereNotNull('cremationId')
					}
				})
				.orderBy('cremations.dateCremationStart', 'DESC')
				// .orderBy('cremations.machineRow', 'ASC')
				// .orderBy('cremations.machineColumn', 'ASC');
		}
	},

	// Get Cremations, given a cremationLogId, get all the cremations on that log
	async OpenCremations(root, { }, context) {
		const knex = context.knex;

		return await knex('cremations')
			.whereNull('dateCremationEnd')
			.andWhere('accountId', context.Account.accountId);
	},

	// Get the list of cremations for the auditing purposes
	async CremationsList(root, { dateEnd, dateStart, machineIds='' }, context) {
		const knex = context.knex;

		return await knex("cremations")
			.select('cremations.*', 'cremationLogs.*', 'machines.machineName', 'orders.petFirstName')
			.join('cremationLogs', 'cremationLogs.cremationLogId', 'cremations.cremationLogId')
			.join('machines', 'machines.machineId', 'cremationLogs.machineId')
			.join('orders', 'orders.orderId', 'cremations.orderId')
			.whereIn('cremationLogs.machineId', function() {
				// If machineIds is '', then get all of the machineIds for this account. Otherwise use the machineIds passed in
				if(machineIds === '') {
					this.select('machineId').from('machines').where({accountId: context.Account.accountId, active: 1})
				} else {
					this.select('machineId').from('machines').whereIn('machineId', machineIds.split(","))
				}
			})
			.andWhere('cremations.dateCremationEnd', '<=', moment(dateEnd).format('YYYY-MM-DD'))
			.andWhere('cremations.dateCremationStart', '>=', moment(dateStart).format('YYYY-MM-DD'))
			.andWhere('cremations.accountId', context.Account.accountId)
			.orderBy('cremations.dateCremationStart', 'desc')
	}
}

// MUTATIONS
const Mutations = {
	// input is an object with the data to insert or update
	// Insert into cremations table
	async CremationSave(root, { input }, context) {
		if(context.Session.User.userTypeId === 2 || context.Session.User.userTypeId === 3) {
			const knex = context.knex;

			const {
				autoStartCommunal=false,
				calledFromCremationsPerform=false,
				column,
				cremationLogId,
				doCommunal,
				doIndividual,
				doPrivate,
				petReferenceNumber,
				row
			} = input;
			console.log({input})
			// This is the variable that will get sent back in the Response if there is an issue adding to the Log
			let cremationWarningString = '';

			let cremationId = 0;
			let accountId = context.Account.accountId;
			input = { ...input, accountId };

			// get the order for this petReferenceNumber
			const [order] = await knex('orders')
				.where({'orders.accountId': accountId,
					'orders.petReferenceNumber': petReferenceNumber});
			console.log({order})
			// check if this petReferenceNumber is already used for a cremation
			if (order) {
				const cremation = await knex('cremations')
					.where('cremations.orderId', order.orderId);
				console.log({cremation})
				// if not already used then check if the Order is ready to be cremated, No ordersProducts that aren't filled: no pending Fur Clippings statusIsFurClipping, Paw Prints statusIsPawPrint, or Visitations statusIsVisitation - statusCompletedAndPackaged
				if(cremation.length === 0) {
					// Check if there are an comments on this Order that are still 'unread'
					const orderComments = await knex('ordersComments')
						.where({
							'ordersComments.orderId': order.orderId,
							'ordersComments.orderCommentStatus': 'unread'
						})

					if(orderComments && orderComments.length > 0) {
						cremationWarningString = cremationWarningString === '' ? `This Order has comments which are still unread.` : `${cremationWarningString} | This Order has comments which are still unread.`
					}

					// Check if there is a Hold on this Order
					const [orderHold] = await knex('ordersHolds')
						.where({ orderId: order.orderId })
						.orderBy('orderHoldId', 'desc')
						.limit(1);

					if(orderHold && orderHold.dateRemoved === null) {
						cremationWarningString = cremationWarningString === '' ? `This Order has a Hold placed on it.` : `${cremationWarningString} | This Order has a Hold placed on it.`
					}

					// Check that the Order's memorialization checkout is completed, or that the memorialization window is closed if the account setting for autoCloseMemorialization = 1
					if(order.memorializationCheckedOut === 1 || order.memorialization === "none" || (moment(order.dateMemorializationEnds).format() < moment().format() && parseInt(context.Account.Settings.find((setting) => setting.name === 'autoCloseMemorialization').value) === 1)) {
						// check for paw prints, fur clippings, and vistations that are not done yet
						const ordersProducts = await knex('ordersProducts')
							.where('ordersProducts.orderId', order.orderId )
							.whereNull('ordersProducts.dateDeleted')
							.whereNull('ordersProducts.dateRefunded')
							.andWhere(function() {
								this.where(function() {
									this.where('statusIsFurClipping', 1).andWhere('statusFurClippingCompleted', 0)
								}).orWhere(function() {
									this.where('statusIsPawPrint', 1).andWhere('statusPawPrintTaken', 0)
								}).orWhere(function() {
									this.where('statusIsVisitation', 1).andWhere('statusCompletedAndPackaged', 0)
								})
							});
						console.log({ordersProducts})
						// get the one undeleted cremation prodct that we want to perform
						const cremationOrderProduct = await knex('ordersProducts')
							.where({'ordersProducts.orderId': order.orderId, 'ordersProducts.statusIsCremation': 1 })
							.whereNull('ordersProducts.dateDeleted')
							.whereNull('ordersProducts.dateRefunded')
							.first();

						// check for all deleted cremation products - indicates an upgrade took place, e.g. communal to private
						const cremationOrderProductsDeleted = await knex('ordersProducts')
							.where({'ordersProducts.orderId': order.orderId, 'ordersProducts.statusIsCremation': 1})
							.whereNotNull('ordersProducts.dateDeleted')

						// if the Order is ready for creation, get the CremationLog and Machine info and find the next open row and column to use
						if(ordersProducts.length === 0) {
							const cremationLog = await knex('cremationLogs')
								.where({'cremationLogs.accountId': accountId,
									'cremationLogs.cremationLogId': cremationLogId })
								.first();

							// if we have an open spot in the machine then create the cremation and return it to the client, loop over rows and columns until we find an open spot
							let spotFilled = null;
							let openRow = null;
							let openColumn = null;

							// If this is called from perform cremation system then calledFromCremationsPerform will be false
							if(calledFromCremationsPerform === false) {
								// get an array of the openCremations to compare to the rows and columns in the machine to find an open spot
								const openCremations = await knex('cremations')
									.where({'cremations.accountId': accountId,
										'cremations.cremationLogId': cremationLogId })
									.whereNull('cremations.dateCremationEnd');
								const machine = await knex('machines')
									.where({'machines.accountId': accountId,
										'machines.machineId': cremationLog.machineId })
									.first();

								// alternate count for communal since they can add more pets than there are rows and columns in a machine
								if(cremationLog.cremationType === "Communal") {
									machine.columns = 5;
									machine.rows = 1;
									let totalSpots = 5;
									if(openCremations.length >= totalSpots) {
										machine.rows = Math.floor(openCremations.length / 5) + 1;
									}
								}
								_.times(machine.rows, i => {
									_.times(machine.columns, j => {
										spotFilled = _.find(openCremations, { 'machineRow': (i + 1), 'machineColumn': (j + 1) });
										// if we found an open spot and don't already have one selected set the openRow and openColumn for this cremation
										if(!spotFilled && openRow === null) {
											openRow = (i + 1);
											openColumn = (j + 1);
										}
									});
								});
							}

							// check if cremation product is paid for online, alternative payment (check or cash), pay at pickup, or invoice vet before proceeding. 
							// Added 12-22-20 by Barrett - new bypass for fulfillment and cremation without payment yet, used for LP walk-ins
							if(order.bypassPaymentRequirement === 0 && cremationOrderProduct.invoiceVet !== 1 && cremationOrderProduct.payAtPickUp !== 1 && cremationOrderProduct.paymentCompletedAlternative !== 1 && cremationOrderProduct.paymentCompletedPetOwner !== 1) {
								if(cremationOrderProductsDeleted !== undefined && cremationOrderProductsDeleted !== null && cremationOrderProductsDeleted.length > 0) {
									cremationWarningString = cremationWarningString === '' ? `Order needs to be paid for before proceeding. Check the Order Details for previously selected cremation services.` : `${cremationWarningString} | Order needs to be paid for before proceeding. Check the Order Details for previously selected cremation services.`
								} else {
									cremationWarningString = cremationWarningString === '' ? `Order needs to be paid for before proceeding.` : `${cremationWarningString} | Order needs to be paid for before proceeding.`
								}
							}
							console.log("hit2a, openRow: ", openRow, " cremationWarningString: ", cremationWarningString)
							// If this is called from Kyle's cremation log system then calledFromCremationsPerform will be false
							if(calledFromCremationsPerform === false) {
								// check if the cremation product is the same type as the cremation log, e.g. Can't do a Private Cremation on a Communal Log, don't create the cremation if it doesn't match
								if(cremationLog.cremationType === "Communal" && cremationOrderProduct.productName !== "Communal Cremation") {
									cremationWarningString = cremationWarningString === '' ? `This Log is for a Communal Cremation and the Order is not.` : `${cremationWarningString} | This Log is for a Communal Cremation and the Order is not.`
								} else if(cremationLog.cremationType === "Individual" && cremationOrderProduct.productName !== "Individual Cremation") {
									cremationWarningString = cremationWarningString === '' ? `This Log is for an Individual Cremation and the Order is not.` : `${cremationWarningString} | This Log is for an Individual Cremation and the Order is not.`
								} else if(cremationLog.cremationType === "Private" && cremationOrderProduct.productName !== "Private Cremation") {
									cremationWarningString = cremationWarningString === '' ? `This Log is for a Private Cremation and the Order is not.` : `${cremationWarningString} | This Log is for a Private Cremation and the Order is not.`
								}

								if(openRow && cremationWarningString === '') {
									// We add await here so that the system will wait until the promise resolves before proceeding to the next line assign the result to a single var for use below. Communal cremations are automatically marked as started
									if(cremationLog.cremationType === "Communal") {
										//const [cremationId] =
										await knex('cremations').insert({ accountId, cremationLogId, dateCremationStart: knex.fn.now(), machineColumn: openColumn, machineRow: openRow, orderId: order.orderId, orderProductId: cremationOrderProduct.orderProductId, petReferenceNumber, petWeight: order.weight, petWeightUnits: order.weightUnits, userIdStart: context.Session.User.userId });
									} else {
										//const [cremationId] =
										await knex('cremations').insert({ accountId, cremationLogId, machineColumn: openColumn, machineRow: openRow, orderId: order.orderId, orderProductId: cremationOrderProduct.orderProductId, petReferenceNumber, petWeight: order.weight, petWeightUnits: order.weightUnits });
									}
									// update order 'orderServiceStatusId': 2 = Cremating
									await knex('orders')
										.where({'accountId': accountId, 'orderId': order.orderId })
										.update ({ 'orderServiceStatusId': 2 });

									return Response(true, 'Cremation for "' + petReferenceNumber + '" successfully created', { Cremation: await knex("cremations").where({ cremationId }).first(), CremationLog: await knex("cremationLogs").where({ cremationLogId }).first() } );
								} else if(!openRow) {
									cremationWarningString = cremationWarningString === '' ? `There are no Open Spots in the Machine.` : `${cremationWarningString} | There are no Open Spots in the Machine.`
								}
							} else {
								console.log({cremationWarningString})
								// This else will only be hit when this CremationSave function is called from the new Cremation Logs system for Jon.
								if(cremationWarningString === '') {
									console.log('inside no warning yet')
									// This CremationSave function is called twice from Jon's new cremation system.
									// The first time when cremationLogId is 0, we checking to see that the order is ready for cremation.
									// The second time cremationLogId > 0, we need to save a record into the cremations table with the log id.

									// See if this machine can do the type of cremation that this order is.
									const [CremationOrderProduct] = await knex('ordersProducts')
										.select('products.productName')
										.join('products', 'products.productId', 'ordersProducts.productId')
										.where('ordersProducts.orderId', order.orderId )
										.whereNull('ordersProducts.dateDeleted')
										.whereNull('ordersProducts.dateRefunded')
										.andWhere('ordersProducts.statusIsCremation', 1)
									console.log({CremationOrderProduct})
									if(cremationLogId > 0) {
										console.log('hit1a')
										const cremationLog = await knex('cremationLogs')
											.where({'cremationLogs.accountId': accountId,
												'cremationLogs.cremationLogId': cremationLogId })
											.first();
										console.log('hit1b')

										// check if the cremation product is the same type as the cremation log, e.g. Can't do a Private Cremation on a Communal Log, don't create the cremation if it doesn't match
										if(cremationLog.cremationType === "Communal" && CremationOrderProduct.productName !== "Communal Cremation") {
											cremationWarningString = `This Log is for a Communal Cremation and the Order is ${CremationOrderProduct.productName}.`;
										} else if(cremationLog.cremationType === "Individual" && CremationOrderProduct.productName !== "Individual Cremation") {
											cremationWarningString = `This Log is for a Individual Cremation and the Order is ${CremationOrderProduct.productName}.`;
										} else if(cremationLog.cremationType === "Private" && CremationOrderProduct.productName !== "Private Cremation") {
											cremationWarningString = `This Log is for a Private Cremation and the Order is ${CremationOrderProduct.productName}.`;
										}

										// If this cremation is for the correct machine cremationType, create the cremation, otherwise send back warning message.
										if(cremationWarningString === '') {
											let newCremationId = 0;
											if(cremationLog.cremationType === "Communal") {
												//
												//
												let tempDateCremationStart = autoStartCommunal === true ? knex.fn.now() : null;
												const [cremationId] = await knex('cremations').insert({ accountId, cremationLogId, dateCremationStart: tempDateCremationStart, machineColumn: column, machineRow: row, orderId: order.orderId, orderProductId: cremationOrderProduct.orderProductId, petReferenceNumber, petWeight: order.weight, petWeightUnits: order.weightUnits, userIdStart: context.Session.User.userId });
												newCremationId = cremationId;
											} else {
												//const [cremationId] =
												const [cremationId] = await knex('cremations').insert({ accountId, cremationLogId, machineColumn: column, machineRow: row, orderId: order.orderId, orderProductId: cremationOrderProduct.orderProductId, petReferenceNumber, petWeight: order.weight, petWeightUnits: order.weightUnits });
												newCremationId = cremationId;
											}
											const Cremation = await knex("cremations").where({ cremationId: newCremationId }).first()

											// const Cremation = await knex("cremations")
											// 	.leftJoin('orders', 'orders.orderId', 'cremations.orderId')
											// 	.where('cremations.cremationId', newCremationId).first()

											return Response(true, 'Cremation for "' + petReferenceNumber + '" successfully created', { Cremation: {...Cremation, cremationType: cremationLog.cremationType}, CremationLog: await knex("cremationLogs").where({ cremationLogId }).first() } );
										} else {
											return Response(false, cremationWarningString, { Cremation: {...input} } );
										}
									} else {
										console.log('hit2b')
										let machineCanDoCremation = true;
										if(CremationOrderProduct && CremationOrderProduct.productName === 'Communal Cremation' && parseInt(doCommunal) === 0) {
											machineCanDoCremation = false;
										} else if(CremationOrderProduct && CremationOrderProduct.productName === 'Individual Cremation' && parseInt(doIndividual) === 0) {
											machineCanDoCremation = false;
										} else if(CremationOrderProduct && CremationOrderProduct.productName === 'Private Cremation' && parseInt(doPrivate) === 0) {
											machineCanDoCremation = false;
										}

										if(machineCanDoCremation === true && CremationOrderProduct) {
											let tempCremationType = '';
											if(CremationOrderProduct.productName === 'Communal Cremation') {
												tempCremationType = 'Communal';
											} else if(CremationOrderProduct.productName === 'Individual Cremation') {
												tempCremationType = 'Individual';
											} else if(CremationOrderProduct.productName === 'Private Cremation') {
												tempCremationType = 'Private';
											}

											return Response(true, 'OK to Cremate', { Cremation: {...input, cremationType: tempCremationType} } );
										} else if(CremationOrderProduct){
											return Response(false, `This machine cannot do ${CremationOrderProduct.productName}`, { Cremation: {...input} } );
										} else {
											return Response(false, 'There is not a Cremation product on this order', { Cremation: {...input} } );
										}
									}
								}
							}

						} else {
							cremationWarningString = cremationWarningString === '' ? `There are Order Products Not Filled Yet (Fur Clippings, Paw Prints, Visitations).` : `${cremationWarningString} | There are Order Products Not Filled Yet (Fur Clippings, Paw Prints, Visitations).`
						}
					} else if(order.memorializationCheckedOut === 0){
						cremationWarningString = cremationWarningString === '' ? `This Order has not completed the memorialization checkout.` : `${cremationWarningString} | This Order has not completed the memorialization checkout.`
					} else if(moment(order.dateMemorializationEnds).format() > moment().format()){
						cremationWarningString = cremationWarningString === '' ? `This Order's memorialization time window is still open.` : `${cremationWarningString} | This Order's memorialization time window is still open.`
					} else {
						return Response(false, "", { Cremation: {...input} } );
					}

				} else {
					cremationWarningString = cremationWarningString === '' ? `Cremation Already Logged.` : `${cremationWarningString} | Cremation Already Logged.`
				}
			} else {
				cremationWarningString = cremationWarningString === '' ? `Not a valid Reference Number.` : `${cremationWarningString} | Not a valid Reference Number.`
			}
			console.log('just before response')
			// If the code gets to this point, it means that the Cremation Log was not created successfully (there is a single Return in this function with Response 'true'). So we can do a return false, with the string of errors.
			return Response(false, cremationWarningString, { Cremation: {...input} } );
		} else {
			return Response(false,"Please Login as Crematory Staff", { Cremation: {} });
		}
	},

	async CremationCancel(root, {cremationId}, context) {
		const knex = context.knex;

		// Get this cremation so we can get the cremationLogId to see if this is the last cremation in the log, then we will close the log.
		let Cremation = await knex('cremations')
			.where('cremations.cremationId', cremationId)
			.andWhere({accountId: context.Account.accountId})
			.first();

		// Set this Order's orderServiceStatus back to Pending
		await knex('orders')
			.update({orderServiceStatusId: 3})
			.where({orderId: Cremation.orderId});

		// Delete this cremation now that we have the cremationLogId
		await knex('cremations')
			.where({cremationId: cremationId})
			.delete();

		// This variable will be used in new Cremation module to remove the cremationLogId from any of the machines IF the log is closed below.
		let cremationLogClosed = false;
		// For the new Cremation system we will want to close the Cremation Log IF this is the last of the open cremations for the log
		const OpenCremations = await knex('cremations')
			.whereNull('dateCremationEnd')
			.andWhere({cremationLogId: Cremation.cremationLogId})

		if(OpenCremations.length === 0) {
			await knex('cremationLogs')
				.update('dateCremationLogEnd', knex.fn.now())
				.where({cremationLogId: Cremation.cremationLogId})

			cremationLogClosed = true;
		}

		return Response(true, "Cremation Successfully Canceled", { cremationLogClosed });
	},

	// used to cancel a cremation before starting in the Cremation Log UI (Kyle's UI)
	async CremationCancelLog(root, {cremationId}, context) {
		const knex = context.knex;

		// Get this cremation so we can get the cremationLogId to see if this is the last cremation in the log, then we will close the log.
		let Cremation = await knex('cremations')
			.where('cremations.cremationId', cremationId)
			.andWhere({accountId: context.Account.accountId})
			.first();

		// Set this Order's orderServiceStatus back to Pending
		await knex('orders')
			.update({orderServiceStatusId: 3})
			.where({orderId: Cremation.orderId});

		// Delete this cremation now that we have the cremationLogId
		await knex('cremations')
			.where({cremationId: cremationId})
			.delete();

		// This variable will be used in new Cremation module to remove the cremationLogId from any of the machines IF the log is closed below.
		let cremationLogClosed = false;
		
		let cremationLog = await knex('cremationLogs')
			.where({cremationLogId: Cremation.cremationLogId})
			.first();

		return Response(true, "Cremation Successfully Canceled", { cremationLogClosed, CremationLog: cremationLog });
	},

	async CremationEnd(root, { input }, context) {
		if(context.Session.User.userTypeId === 2 || context.Session.User.userTypeId === 3) {
			const knex = context.knex;
			const {
				calledFromCremationsPerform=false, // This will be true when this function is called new cremation module
				cremationId,
				cremationEndScheduledMinutes=0
			} = input;
			console.log({input})
			let accountId = context.Account.accountId;
			input = { ...input, accountId };

			// Added functionality for being able to schedule the time the cremation will end. Use for end of day cremations.
			//let dateCremationEnd = cremationEndScheduledMinutes > 0 ? moment().add(cremationEndScheduledMinutes, 'm').format('YYYY-MM-DD HH:mm:ss') : knex.fn.now();
			let dateCremationEnd = knex.fn.now();
			await knex('cremations')
				.where({ cremationId })
				.andWhere({accountId: accountId})
				.update ({
					'cremationEndScheduledMinutes': cremationEndScheduledMinutes,
					'dateCremationEnd': dateCremationEnd, 
					'userIdEnd': context.Session.User.userId });

			let Cremation = await knex('cremations')
				.where('cremations.cremationId', cremationId)
				.andWhere({accountId: accountId})
				.first();

			// update order 'orderServiceStatusId': 1 = Cremated
			await knex('orders')
				.where({'accountId': context.Account.accountId, 'orderId': Cremation.orderId })
				.update ({ 'orderServiceStatusId': 1 });

			// This variable will be used in new Cremation module to remove the cremationLogId from any of the machines IF the log is closed below.
			let cremationLogClosed = false;
			// For the new Cremation system we will want to close the Cremation Log IF this is the last of the open cremations for the log
			if(calledFromCremationsPerform === true) {
				const OpenCremations = await knex('cremations')
					.whereNull('dateCremationEnd')
					.andWhere({cremationLogId: Cremation.cremationLogId})

				if(OpenCremations.length === 0) {
					await knex('cremationLogs')
						.update({'dateCremationLogEnd': dateCremationEnd, 'cremationEndScheduledMinutes': cremationEndScheduledMinutes})
						.where({cremationLogId: Cremation.cremationLogId})

					cremationLogClosed = true;
					
					// if Communal with no Memorialization products then automatically update the order Status to Completed and update orderservice status to Cremated orderServiceStatusId = 1
					let cremationLog = await knex('cremationLogs')
						.where({cremationLogId: Cremation.cremationLogId})
						.first();

					let memorializationProducts = await knex('ordersProducts')
						.join('products', 'products.productId', 'ordersProducts.productId')
						.join('productTypes', 'productTypes.productTypeId', 'products.productTypeId')
						.where('productTypes.productType', "Memorialization")
						.andWhereNot('products.productCategoryId', 12)
						.andWhere('ordersProducts.orderId', Cremation.orderId);
					
					if(cremationLog.cremationType === "Communal" && memorializationProducts.length === 0) {
						// Check if this Order already has 'dateCompleted', which is what we use to determine if the order can be invoiced.
						const OrderCompleted = await knex('orders').whereNull('dateCompleted').andWhere({orderId: Cremation.orderId});
						if(OrderCompleted.length > 0) {
							await knex('orders')
								.where('orders.orderId', Cremation.orderId)
								.update ({ 'dateCompleted': knex.fn.now(), 'orderStatusId':  3, 'orderServiceStatusId': 1 });
						} else {
							await knex('orders')
								.where('orders.orderId', Cremation.orderId)
								.update ({ 'orderStatusId':  3, 'orderServiceStatusId': 1 });
						}
					}
				}
			}

			return Response(true, "Cremation Successfully Ended", { Cremation: Cremation, cremationLogClosed });
		} else {
			return Response(false,"Please Login as Crematory Staff", { Cremation: {} });
		}
	},
	async CremationsListPDF(root, {input}, context) {
		const knex = context.knex;
		const { dateEnd, dateStart, machineIds } = input;

		// Create the Tag for the Cremation
		const payload = JSON.stringify({
			template: "cremationsList",
			dateEnd: dateEnd,
			dateStart: dateStart,
			machineIds: machineIds,
			orderId: 0
		});

		const [jobId] = await knex("jobs").insert({
			accountId: context.Account.accountId,
			payload,
			queue: "pdf",
			status: "pending"
		});

		// Use the headers tp send in the account URL so the worker can get the proper context.
		await enqueueMessage("pdf", payload, { appId: String(jobId), headers: { filename: `cremationsList.pdf`, folder: "cremationsList", accountId: String(context.Account.accountId), url: context.Account.url  } } );

		return {jobId};

	},
	async CremationStart(root, { input }, context) {
		if(context.Session.User.userTypeId === 2 || context.Session.User.userTypeId === 3) {
			const knex = context.knex;
			const {
				calledFromCremationsPerform=false, // This will be true when this function is called from new cremation module
				cremationId
			} = input;

			let accountId = context.Account.accountId;
			input = { ...input, accountId };
		console.log(`Cremation Start input: ${input}`)
			await knex('cremations')
				.where({ cremationId })
				.andWhere({accountId: accountId})
				.update ({"dateCremationStart": knex.fn.now(), 'userIdStart': context.Session.User.userId });

			let Cremation = await knex('cremations')
				.where('cremations.cremationId', cremationId)
				.andWhere({accountId: accountId})
				.first();

			// update order 'orderServiceStatusId': 2 = Cremating
			await knex('orders')
				.where({'accountId': context.Account.accountId, 'orderId': Cremation.orderId })
				.update ({ 'orderServiceStatusId': 2 });

			if(calledFromCremationsPerform === false) {
				return Response(true, "Cremation Successfully Started", { Cremation: Cremation });
			} else {
				return Response(true, "Cremation Successfully Started", { Cremation: Cremation, CremationLog: await knex("cremationLogs").where({ cremationLogId: Cremation.cremationLogId }).first() });
			}
		} else {
			return Response(false,"Please Login as Crematory Staff", { Cremation: {} });
		}
	},
	async CremationRemove( root, { cremationId }, context ) {
		if(context.Session.User.userTypeId === 2 || context.Session.User.userTypeId === 3) {
			const knex = context.knex;

			if ( cremationId ) {
				// Run the multiple deletes in a transaction.
				const removed = await knex.transaction(async (trx) => {
					const cremationRemoved = await trx("cremations").delete().where({ cremationId });
					return cremationRemoved;
				});

				if( removed ) {
					return Response(true,"Cremation removed");
				} else {
					return Response(false,"Cremation not found, could not be removed");
				}
			} else {
				return Response(false,"Cremation could not be removed");
			}
		} else {
			return Response(false,"Please Login as Crematory Staff", { Cremation: {} });
		}
	}
}

// EXPORT
export { CremationSubResolvers, Mutations, CremationRootResolvers }
