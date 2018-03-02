exports.base_url = 'https://sandbox-healthservice.priaid.ch/';
exports.token_auth_url = 'https://sandbox-authservice.priaid.ch/login';
// TODO: Please fetch this from db or env variables
exports.auth_details = {
    username: 'masikapolycarp@gmail.com',
    password: 'Pm8q5L3Egw9K4Ayr7',
}

exports.url_endpoints = {
    // Symptoms can be either called to receive the full list of symptoms
    // or a subset of symptoms (e.g. all symptoms of a body sublocation)
    load_symptoms: 'symptoms',
    // Issues can be either called to receive the full list of
    // issues or a subset of issues (e.g. all issues of a diagnosis).
    // TODO: You should probably save all of this in our db
    load_issues: 'issues',
    // Issue info can be called to receive all information about a health issue.
    // The short description gives a short overview.
    // A longer information can consist of "Description", "MedicalCondition", "TreatmentDescription"
    // this is called as issue/[issue_code]/info
    load_issueInfo: 'issues',
    // The diagnosis is the core function of the symptom-checker to compute the
    // potential health issues based on a set of symptoms, gender and age
    // parameters include comma separated ids of symptoms, sex and year of birth
    load_diagnosis: 'diagnosis',
    // The diagnosis is the core function of the symptom-checker to compute the potential
    // health issues based on a set of symptoms, gender and age, but instead of getting
    // computed diagnosis, you can also get list of suggested specialisations for calulated diseases
    // parameters include comma separated ids of symptoms, sex and year of birth
    load_specialisations: 'diagnosis/specialisations',
    // The proposed symptoms can be called to request additional symptoms
    // which can be related to the given symptoms in order to refine the diagnosis.
    // parameters include comma separated ids of symptoms, sex and year of birth
    load_proposed_symptoms: 'symptoms/proposed',
    // Body locations can be called to receive all the body locations
    // TODO: You should probably save all of this in our db
    load_body_locations: 'body/locations',
    // Body sublocations can be called to receive all the body sub locations from a body location.
    // parameter is body location id
    load_body_sublocations: 'body/locations/',
    // Symptoms in body sublocations can be called to receive all the symptoms in a body sub location.
    // params symptoms/[ibody_sublocation]/[man,woman,boy,girl]
    load_body_sublocation_symptoms: 'symptoms',
    // Red flag texts are recommendations to the patient for a higher urgency or
    // severeness of the possible symptoms. As an example a patient with pain in
    // the breast might have a heart attack and therefore the patient should be warned
    // about the urgency and severeness of the matter.
    // params sympto_id
    load_red_flag_text: 'redflag'
};
