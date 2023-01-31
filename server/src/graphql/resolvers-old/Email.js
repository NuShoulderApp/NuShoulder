import { enqueueMessage } from "../../utilities/RabbitMQ";
import { Response } from "../../utilities/helpers";

// QUERIES
export const Mutations = {
	async sendEmail(root, { EmailInput }, context) {
		const result = await sendEmail(EmailInput, context);

		return Response(true, "Email Successfully Submitted", result);
	}
}

export async function sendEmail(EmailInput, context){
	const {
		from,
		to,
		subject
	} = EmailInput;

	const payload = JSON.stringify(EmailInput);

	const [jobId] = await context.knex("jobs").insert({
		accountId: context.Account.accountId,
		payload,
		queue: "email",
		status: "pending"
	});

	await enqueueMessage("email", payload, { appId: String(jobId), headers: { accountId: String(context.Account.accountId), url: context.Account.url  } } );

	return { from, to, subject };
}
