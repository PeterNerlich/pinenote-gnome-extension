// rockchip-usb functions, mainly communicating with the dbus service for the
// Pinenote
// const Gio = imports.gi.Gio;
// const GLib = imports.gi.GLib;
import GLib from 'gi://GLib';
import Gio from 'gi://Gio';

// regenerate with
// dbus-send --system --print-reply --dest=org.pinenote.usb /usb org.freedesktop.DBus.Introspectable.Introspect

// make sure to fix the <node> tag and remove the "name"
const PinenoteUSBDbusInterface = `
<node>
  <interface name="org.pinenote.usb">
    <method name="usb_cable_connected">
    </method>
    <method name="usb_gadget_activate_mtp">
    </method>
    <method name="usb_gadget_disable_mtp">
    </method>
  </interface>
</node>
`

const PinenoteUSBDbusProxy = Gio.DBusProxy.makeProxyWrapper(PinenoteUSBDbusInterface);

export var PnUSBProxy = new PinenoteUSBDbusProxy(
    Gio.DBus.system,
    "org.pinenote.usb",
    "/usb",
);
