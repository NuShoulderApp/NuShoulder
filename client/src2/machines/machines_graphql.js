import gql from 'graphql-tag';

const machineFields = `
	accountId
	active
	columns
	cremationLogId
	dateCreated
	doCommunal
	doIndividual
	doPrivate
	isMultiChamber
	machineId
	machineName
	rows
`;

// GET ONE MACHINE
export const getMachineQuery = gql`
    query Machine($machineId: ID) {
		Machine (machineId: $machineId) {
			${machineFields}
		}
	}
`;

// GET ARRAY OF MACHINES
export const getMachinesQuery = gql`
    query Machines($active: Int) {
		Machines (active: $active) {
			${machineFields}
		}
	}
`;

// MACHINE SAVE
export const MachineSaveMutation = gql`
	mutation MachineSave($input: MachineInput!) {
		MachineSave (input: $input) {
            Machine {
				${machineFields}
			}
			Machines {
				${machineFields}
			}
			Response {
				success
				message
			}
		}
	}
`;

// MACHINE DELETE
export const MachineRemoveMutation = gql`
	mutation MachineRemove($machineId: ID!) {
		MachineRemove (machineId: $machineId) {
			Response{
				success
				message
			}
		}
	}
`;
