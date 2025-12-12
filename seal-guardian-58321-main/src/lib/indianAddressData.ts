import { State, City } from 'country-state-city';

export const getAllStates = () => {
    return State.getStatesOfCountry('IN');
};

export const getCitiesByState = (stateCode: string) => {
    return City.getCitiesOfState('IN', stateCode);
};

export interface PincodeDetails {
    district: string;
    state: string;
    city: string;
}

export const fetchPincodeDetails = async (pincode: string): Promise<PincodeDetails | null> => {
    if (pincode.length !== 6) return null;

    try {
        const response = await fetch(`https://api.postalpincode.in/pincode/${pincode}`);
        const data = await response.json();

        if (data && data[0] && data[0].Status === "Success") {
            const postOffice = data[0].PostOffice[0];
            return {
                district: postOffice.District,
                state: postOffice.State,
                city: postOffice.District // Using District as City for auto-fill default
            };
        }
        return null;
    } catch (error) {
        console.error("Error fetching pincode details:", error);
        return null;
    }
};
