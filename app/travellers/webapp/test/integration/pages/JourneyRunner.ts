import JourneyRunner from "sap/fe/test/JourneyRunner";
import ListReport from "sap/fe/test/ListReport";
import ObjectPage from "sap/fe/test/ObjectPage";
import CustomTravellersListGenerated from "./TravellersList.gen";
import CustomTravellersObjectPageGenerated from "./TravellersObjectPage.gen";
import CustomTravelledLocationsObjectPageGenerated from "./TravelledLocationsObjectPage.gen";

const runner = new JourneyRunner({
    launchUrl: sap.ui.require.toUrl("burhan/claude/travellers") + "/test/flp.html#app-preview",
    pages: {
        onTheTravellersListGenerated: new ListReport(
            {
                appId: "burhan.claude.travellers",
                componentId: "TravellersList",
                entitySet: "",
                contextPath: "/Travellers"
            },
            CustomTravellersListGenerated
        ),
        onTheTravellersObjectPageGenerated: new ObjectPage(
            {
                appId: "burhan.claude.travellers",
                componentId: "TravellersObjectPage",
                entitySet: "",
                contextPath: "/Travellers"
            },
            CustomTravellersObjectPageGenerated
        ),
        onTheTravelledLocationsObjectPageGenerated: new ObjectPage(
            {
                appId: "burhan.claude.travellers",
                componentId: "TravelledLocationsObjectPage",
                entitySet: "",
                contextPath: "/Travellers/locations"
            },
            CustomTravelledLocationsObjectPageGenerated
        )
    },
    async: true
});

export default runner;
