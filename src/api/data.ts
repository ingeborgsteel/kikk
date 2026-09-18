import { Hono } from "hono";
import observationsApp from "./routes/observations";
import locationsApp from "./routes/locations";
import usersApp from "./routes/users";
import userAccessesApp from "./routes/userAccesses";
import featureAlertDismissalsApp from "./routes/featureAlertDismissals";

const dataApp = new Hono<{ Bindings: Env }>();

dataApp.route("/observations", observationsApp);
dataApp.route("/locations", locationsApp);
dataApp.route("/users", usersApp);
dataApp.route("/user-accesses", userAccessesApp);
dataApp.route("/feature-alert-dismissals", featureAlertDismissalsApp);

export default dataApp;
