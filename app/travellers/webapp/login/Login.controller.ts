import Controller from "sap/ui/core/mvc/Controller";
import Input from "sap/m/Input";
import Button from "sap/m/Button";
import MessageStrip from "sap/m/MessageStrip";
import ResourceModel from "sap/ui/model/resource/ResourceModel";
import ResourceBundle from "sap/base/i18n/ResourceBundle";

/**
 * @namespace burhan.claude.travellers.login
 */
export default class Login extends Controller {

	public onInit(): void {
		const i18n = new ResourceModel({ bundleName: "burhan.claude.travellers.i18n.i18n" });
		this.getView()!.setModel(i18n, "i18n");
		// Already signed in? Go straight to the app.
		fetch("/me", { credentials: "same-origin" })
			.then((r) => { if (r.ok) { window.location.replace("index.html"); } })
			.catch(() => { /* stay on login */ });
	}

	public async onLogin(): Promise<void> {
		const userId = (this.byId("userId") as Input).getValue().trim();
		const password = (this.byId("password") as Input).getValue();
		const button = this.byId("loginButton") as Button;

		if (!userId || !password) {
			return this.showError("loginMissing");
		}

		button.setEnabled(false);
		try {
			const res = await fetch("/login", {
				method: "POST",
				credentials: "same-origin",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ userId, password })
			});
			if (res.ok) {
				(this.byId("password") as Input).setValue("");
				window.location.replace("index.html");
				return;
			}
			this.showError(res.status === 429 ? "loginTooMany" : "loginFailed");
		} catch {
			this.showError("loginNetwork");
		} finally {
			button.setEnabled(true);
		}
	}

	private showError(key: string): void {
		const bundle = (this.getView()!.getModel("i18n") as ResourceModel).getResourceBundle() as ResourceBundle;
		const strip = this.byId("error") as MessageStrip;
		strip.setText(bundle.getText(key) ?? key);
		strip.setVisible(true);
		(this.byId("password") as Input).setValue("").focus();
	}
}
