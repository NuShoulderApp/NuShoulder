import Math from 'mathjs';
import { Response } from "../../utilities/helpers";

// NOTE: use camelCase for fields and PascalCase for types and objects

// MUTATIONS
const PetReferenceNumberMutations = {
	// Generate X number of petReferenceNumbers
	async petReferenceNumberGenerate(root, {input}, context) {
		const { numberToGenerate } = input;

		let counter = 0;
		let exitWhileLoop = false;
		let petReferenceNumbersArray = [];
		let randomNumber = '';

		// Generate the petReferenceNumbers
		while(counter < numberToGenerate) {
			//reset the exitWhileLoop to fasle each time through
			exitWhileLoop = false;

			while(exitWhileLoop === false) {
				randomNumber = '';
				// Generate a random number for the petReferencenumber and verify that it is unique via the db
				const Options = ['A','B','C','D','E','F','G','H','J','K','L','M','N','P','Q','R','S','T','U','V','W','X','Y','Z','2','3','4','5','6','7','8','9'];
				let i;
				for ( i = 0; i < 7; i++ ) {
					randomNumber = randomNumber + Options[Math.floor(Math.random() * Math.floor(32))]
				}

				// See if this number has been used yet
				const [PetReferenceNumber] = await context.knex('petReferenceNumbers')
					.where({ referenceNumber: randomNumber })

				// Exit the loop if this is a new number
				if(PetReferenceNumber === undefined) {
					exitWhileLoop = true;
				}
			}

			// Insert the new petReferenceNumber in to the table
			await context.knex('petReferenceNumbers').insert({ referenceNumber: randomNumber, accountId: context.Account.accountId });

			// Add randomNumber to the array of numbers in order to print them when we are finished
			petReferenceNumbersArray.push({petReferenceNumber: randomNumber});

			// Update the counter
			counter += 1
		}

		// Return success and the array of petReferenceNumbers
		return Response(true,"Pet Reference Numbers Generated", {PetReferenceNumbers: petReferenceNumbersArray});
	}
}

// EXPORT
export { PetReferenceNumberMutations as Mutations }
