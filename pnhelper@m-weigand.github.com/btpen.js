// copied and modified from gnome-shell:
// gnome-shell-44.9/js/ui/status/bluetooth.js
// gpl-2.0+
// -*- mode: js; js-indent-level: 4; indent-tabs-mode: nil -*-
/* exported Indicator */

const {Gio, GLib, GnomeBluetooth, GObject, Pango, St} = imports.gi;
const Main = imports.ui.main;

const {Spinner} = imports.ui.animation;
const PopupMenu = imports.ui.popupMenu;
const {QuickToggle, QuickMenuToggle, SystemIndicator} = imports.ui.quickSettings;
// This is the live instance of the Quick Settings menu
const QuickSettingsMenu = imports.ui.main.panel.statusArea.quickSettings;

const {loadInterfaceXML} = imports.misc.fileUtils;

const {AdapterState} = GnomeBluetooth;

const BUS_NAME = 'org.gnome.SettingsDaemon.Rfkill';
const OBJECT_PATH = '/org/gnome/SettingsDaemon/Rfkill';

const RfkillManagerInterface = loadInterfaceXML('org.gnome.SettingsDaemon.Rfkill');
const rfkillManagerInfo = Gio.DBusInterfaceInfo.new_for_xml(RfkillManagerInterface);

const UPowerIface = loadInterfaceXML('org.freedesktop.UPower.Device');
const UPowerInfo = Gio.DBusInterfaceInfo.new_for_xml(UPowerIface);
// const UPowerProxy = Gio.DBusProxy.makeProxyWrapper(UPowerIface);
//
//

// regenerate with
// dbus-send --system --print-reply --dest=org.pinenote.pen /pen org.freedesktop.DBus.Introspectable.Introspect
// make sure to fix the <node> tag by removing the "name="..." property
const PineNoteDbusInterfacePen = `
<node>
	  <interface name="org.pinenote.pen">
	    <method name="AutoConnect">
	      <arg name="success" type="b" direction="out"/>
	    </method>
	    <method name="DoScan">
	      <arg name="scan_results" type="as" direction="out"/>
	    </method>
	    <method name="ForgetAddress">
	    </method>
	    <method name="GetAddress">
	      <arg name="pen_address" type="s" direction="out"/>
	    </method>
	    <method name="GetBattery">
	      <arg name="pen_battery" type="s" direction="out"/>
	    </method>
	    <method name="GetVersion">
	      <arg name="pen_version" type="s" direction="out"/>
	    </method>
	    <method name="IsRegistered">
	      <arg name="pen_is_registered" type="b" direction="out"/>
	    </method>
	    <method name="SetAddress">
	      <arg name="pen_address" type="s" direction="in"/>
	    </method>
	    <signal name="PenRegStatusChanged">
	    </signal>
	  </interface>
</node>
`
const PinenotePenDbusProxy = Gio.DBusProxy.makeProxyWrapper(PineNoteDbusInterfacePen);

const BtPenManager = GObject.registerClass({
    Properties: {
        'pen-reg-status-changed': GObject.ParamSpec.boolean(
            'pen-reg-status-changed', '', '',
            GObject.ParamFlags.READABLE,
            false),
    },
}, class BtPenManager extends GObject.Object {
    constructor() {
        super();

		const UPowerProxy = Gio.DBusProxy.makeProxyWrapper(UPowerIface);
		this._proxy_upowerd= new UPowerProxy(
			Gio.DBus.system,
			"org.freedesktop.DBus.Properties",
			"/org/freedesktop/UPower/devices/battery_ws8100_pen",
		);

		this._proxy= new PinenotePenDbusProxy(
			Gio.DBus.system,
			"org.pinenote.pen",
			"/pen",
		);
		function func_signal (connection, sender, path, iface, signal, params){
			log("func_signal btpen");
		}

		log("@@@@@@@@@@@@@--------------------> BtPen Connecting to signal");
        this._proxy.connectSignal('PenRegStatusChanged',
			// func_signal);
			this._changed.bind(this));

        this._proxy.connectSignal('PenRegStatusChanged',
			function (proxy) {
				log("PEN CHANGED");
				Main.notify(_("PEN Changed its address"));
				this.notify("pen-reg-status-changed");
			}
		);
    }

    /* eslint-disable camelcase */
    get pen_reg_status_changed() {

    }

    set pen_reg_status_changed(v) {
    }

    /* eslint-enable camelcase */

    _changed(proxy) {
		log("SIGNAL CHANGED BTPenManager");
    }
});


const BtPenToggle_ngu = GObject.registerClass(
	class BtPenToggle_ngu extends QuickToggle {
		_init() {
			super._init({
				title: 'BT en Button',
				iconName: 'mail-attachment-symbolic',
			});

			// this._manager = new BtPenManager();
			log("BtPenToggle_ngu init");
			this._proxy= new PinenotePenDbusProxy(
				Gio.DBus.system,
				"org.pinenote.pen",
				"/pen",
			);

			this.update_toggle();
			// let is_registered = this._proxy.IsRegisteredSync();
			// log("dbus answer");
			// log(is_registered);
			// if (is_registered) {
			// 	log("pen is registered, setting to true");
			// 	this.checked = true;
			// 	this.visible = true;
			// } else {
			// 	log("pen is not registered, setting to false");
			// 	this.checked = false;
			// 	this.visible = false;
			// }

			this._proxy.connectSignal('PenRegStatusChanged',
				function (proxy) {
					log("PEN CHANGED");
					Main.notify(_("PEN Changed its address"));
					// this.notify("pen-reg-status-changed");
					this.update_toggle();
				}
			);

// 			this._manager = getRfkillManager();
// 			this._manager.bind_property('show-airplane-mode',
// 							this, 'visible',
// 							GObject.BindingFlags.SYNC_CREATE);
// 			this._manager.bind_property('airplane-mode',
// 							this, 'checked',
// 							GObject.BindingFlags.SYNC_CREATE);

			this.connect('clicked',
							// () => (this._manager.airplaneMode = !this._manager.airplaneMode));
				() => {
					log("CLICKED");
					if (this.checked){
						// turn it off
						log("CLICK: Forgetting Pen");
						this._proxy.ForgetAddressSync();
						this.checked = false;
					} else {
						log("CLICK: Auto-Connecting");
						this._proxy.AutoConnectAsync();
						Main.notify(_(
							"Attempting pen connecting. Press buttons"
						));
						this.checked = true;
					}
					this.visible = true;
				}
			);

			// we use the timer to query the battery level
			GLib.timeout_add_seconds(
				GLib.PRIORITY_DEFAULT,
				15,
				() => {
					log("REG REG REG");
					log(this.checked);
					this.title = 'asss';
					return GLib.SOURCE_CONTINUE;
				}
			);
		}

		update_toggle() {
			log("Updating toggle from DBUS");
			let is_registered = (
				this._proxy.IsRegisteredSync() === 'true'
			);
			log("dbus answer:");
			log(is_registered);
			log(typeof(is_registered));
			if (is_registered) {
				log("pen is registered, setting to true");
				this.checked = true;
				this.visible = true;
			} else {
				log("pen is not registered, setting to false");
				this.checked = false;
				this.visible = true;
			}
		}
	});

var Indicator_ng = GObject.registerClass(
class Indicator_ng extends SystemIndicator {
    _init() {
        super._init();
		log("BTPEN");

        // this._client = new BtPenClient();
        // this._client.connect('devices-changed', () => this._sync());

        this._indicator = this._addIndicator();
        this._indicator.icon_name = 'bluetooth-active-symbolic';

		this._toggle = new BtPenToggle_ngu()
		this._toggle.connectObject(
			'notify::visible', () => this._sync(),
			'notify::checked', () => this._sync(),
			this
		);

        this.quickSettingsItems.push(this._toggle);

		QuickSettingsMenu._addItems(this.quickSettingsItems);

        this._sync();
    }

    _sync() {
		log("Indicator_ng SYNC");
		// Only show indicator when airplane mode is on
		const {visible, checked} = this._toggle;
		this._indicator.visible = visible && checked;
    }
});
