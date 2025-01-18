// rockchip-ebc functions, mainly communicating with the dbus service for the
// Pinenote
// const Gio = imports.gi.Gio;
// const GLib = imports.gi.GLib;
import Gio from 'gi://Gio';
import GLib from 'gi://GLib';

// regenerate with
// dbus-send --system --print-reply --dest=org.pinenote.ebc /ebc org.freedesktop.DBus.Introspectable.Introspect
// make sure to fix the <node> tag by removing the "name="..." property
const PinenoteDbusInterface = `
<node>
  <interface name="org.pinenote.ebc">
    <method name="GetAutoRefresh">
      <arg name="state_auto_refresh" type="b" direction="out"/>
    </method>
    <method name="SetAutoRefresh">
      <arg name="state" type="b" direction="in"/>
    </method>
    <method name="GetBwMode">
      <arg name="current_mode" type="y" direction="out"/>
    </method>
    <method name="SetBwMode">
      <arg name="new_mode" type="y" direction="in"/>
    </method>
    <method name="GetBwDitherInvert">
      <arg name="current_mode" type="b" direction="out"/>
    </method>
    <method name="SetBwDitherInvert">
      <arg name="new_mode" type="b" direction="in"/>
    </method>
    <method name="GetDclkSelect">
      <arg name="dclk_select" type="y" direction="out"/>
    </method>
    <method name="SetDclkSelect">
      <arg name="state" type="y" direction="in"/>
    </method>
    <method name="GetDefaultWaveform">
      <arg name="current_waveform" type="y" direction="out"/>
    </method>
    <method name="SetDefaultWaveform">
      <arg name="waveform" type="y" direction="in"/>
    </method>
    <method name="GetNoOffScreen">
      <arg name="no_off_screen" type="b" direction="out"/>
    </method>
    <method name="SetNoOffScreen">
      <arg name="new_mode" type="b" direction="in"/>
    </method>
    <method name="RequestQualityOrPerformanceMode">
      <arg name="mode_request" type="y" direction="in"/>
    </method>
    <method name="SetEBCParameters">
      <arg name="default_waveform" type="y" direction="in"/>
      <arg name="bw_mode" type="y" direction="in"/>
    </method>
    <method name="TriggerGlobalRefresh">
    </method>
    <signal name="AutoRefreshChanged">
    </signal>
    <signal name="BwModeChanged">
    </signal>
    <signal name="DclkSelectChanged">
    </signal>
    <signal name="WaveformChanged">
    </signal>
    <signal name="NoOffScreenChanged">
    </signal>
    <signal name="RequestedQualityOrPerformance">
      <arg name="requested_mode" type="y"/>
    </signal>
    <property name="default_waveform" type="y" access="readwrite"/>
  </interface>
</node>
`

const PinenoteDbusProxy = Gio.DBusProxy.makeProxyWrapper(PinenoteDbusInterface);

export var PnProxy = new PinenoteDbusProxy(
    Gio.DBus.system,
    "org.pinenote.ebc",
    "/ebc",
);

export function ebc_trigger_global_refresh(){
    PnProxy.TriggerGlobalRefreshSync();
}

export function ebc_subscribe_to_waveformchanged(func, widget){
    function func_signal (connection, sender, path, iface, signal, params){
        func(connection, sender, path, iface, signal, params, widget);
    }
    const ebc_dbus = PnProxy.connectSignal(
        "WaveformChanged", func_signal
    );
    return(ebc_dbus);
}

// the pinenote-dbus-service can emit a signal which indicates that a
// performance-mode-change was requested
export function ebc_subscribe_to_requestperformancemode(func, widget){
    function func_signal (connection, sender, path, iface, signal, params){
        func(connection, sender, path, iface, signal, params, widget);
    }
    const ebc_dbus = PnProxy.connectSignal(
        "RequestedQualityOrPerformance", func_signal
    );
    return(ebc_dbus);
}

//Disconnect from the dbus signal when the extension is stopped
export function ebc_unsubscribe(dbus_handler){
    PnProxy.disconnectSignal(dbus_handler);
}