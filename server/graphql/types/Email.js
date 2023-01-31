// main User types and inputs to be exported
export default `
	type EmailResponse {
		Response: Response
		from: String
		to: String
		subject: String
	}

	input EmailInput {
		from: String
		to: String
		subject: String
		text: String
		html: String
		attachments: [Int]
	}

	extend type RootMutation {
		sendEmail(EmailInput: EmailInput!): EmailResponse!
	}
`;
