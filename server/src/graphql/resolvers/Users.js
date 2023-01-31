import _ from "lodash";
import db from '../../models/index.js';


// import { UserAddressRootResolvers } from "./UserAddress";
// import { UserPhoneRootResolvers } from "./UserPhone";
// import { AuthenticationError } from 'apollo-server';
// import { Response } from "../../utilities/helpers";

const UserSubResolvers = {
}


// QUERIES
const UserRootResolvers = {
    users: async() => db.users.findAll(),
}

// MUTATIONS
const UserMutations = {
}

// EXPORT
export { UserSubResolvers, UserMutations, UserRootResolvers }
