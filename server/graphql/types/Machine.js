const MachineFields = `
    accountId: ID
	active: Int
	columns: Int
	cremationLogId: ID
	dateCreated: Date
	doCommunal: Int
	doIndividual: Int
	doPrivate: Int
	isMultiChamber: Int
	machineId: ID
	machineName: String
	rows: Int
`;

export default `
	type Machine {
        ${MachineFields}
	}

	input MachineInput {
		${MachineFields}
	}

	type MachineResponse {
		Machine: Machine,
		Machines: [Machine],
		Response: Response
	}

	extend type RootMutation {
		MachineRemove(input: MachineInput!): MachineResponse
		MachineSave(input: MachineInput!): MachineResponse
	}

    extend type RootQuery {
		Machine(machineId: ID): Machine
		Machines(active: Int): [Machine]
    }
`;