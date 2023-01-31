import { gql } from '@apollo/client';

export const GetUsers = gql`
    query GetUsers {
        users {
            user_ID,
            user_type_ID,
            first_name,
            last_name
        }
    }
`;

