import { Control } from '../control.js';
import { UtilDOM } from '../utildom.js';
import { AppContext } from '../appcontext.js';
import { EventBus } from '../eventbus.js';

export class ControlDevices extends Control {
    constructor({devices,selectedIdOrIds,hasToHaveSelection}){
        super();
        this.selectedDeviceIdOrIds = selectedIdOrIds;
        this.devices = devices;
        this.hasToHaveSelection = hasToHaveSelection;
    }
    
    get isMultiple(){
        return Util.isArray(this.selectedDeviceIdOrIds);
    }
    set devices(devices){
        this._devices = devices;
        const selectedDeviceIdOrIds = this.selectedDeviceIdOrIds;
        var anySelected = false;
        this.deviceControls = devices.map(device=>{
            const controlDevice = new ControlDevice(device);
            const isSelected = this.isMultiple ? selectedDeviceIdOrIds.includes(device.deviceId) : device.deviceId == selectedDeviceIdOrIds;
            controlDevice.setIsSelected(isSelected);
            if(isSelected){
                anySelected = true;
            }
            return controlDevice;
        });
        if(this.deviceControls.length == 0){
            this.setSelectedDevice(null);
            return;
        }
        if(!anySelected && this.hasToHaveSelection){
            this.setSelectedDevice(this.deviceControls[0]);
        }
    }
    get devices(){
        return this._devices;
    }
	getDevice(deviceId){
		return this.devices.getDevice(deviceId);
	}
    async testLocalNetworkDevices(){
        return await this.devices.testLocalNetworkDevices({});
    }
    // getHtmlFile(){
    //     return "./v2/device/devices.html";
    // }
    getHtml(){
        return `<div>
                    <div id="nodevices" class="hidden">No Devices</div>
                    <div id="loadingdevices" class="hidden">Loading Devices...</div>
                    <div class="filedragover">Drop Files on a device to upload</div>
                    <div id="devices" class="hidden"></div>        
                </div>`;
    }
    getStyleFile(){
        return "./v2/device/devices.css";
    }
    setSelectedDevice(deviceControl,wasClick){
        if(!this.isMultiple || !deviceControl){
            this.deviceControls.forEach(deviceControl=>deviceControl.setIsSelected(false));
        }
        if(!deviceControl){
            EventBus.postSticky(new SelectedDevice(null));
            this.selectedDeviceIdOrIds = this.isMultiple ? [] : null;
            return;
        }
        const isSelected = this.isMultiple ? !deviceControl.isSelected : true;
        deviceControl.setIsSelected(isSelected,wasClick);
        this.selectedDeviceIdOrIds = this.isMultiple ? this.currentSelectedDeviceIds : deviceControl.device.deviceId;
    }
    set currentSelectedDeviceIds(value){
        this.selectedDeviceIdOrIds = value;
    }
    get currentSelectedDeviceIds(){
        if(!this.deviceControls) return [];

        const selectedDeviceControls = this.deviceControls.filter(deviceControl=>deviceControl.isSelected);
        const selectedIds = [];
        for(const deviceControl of selectedDeviceControls){
            selectedIds.push(deviceControl.device.deviceId);
        }
        return selectedIds;
    }
    async renderSpecific({root}){
        this.devicesControl = await this.$("#devices");
        this.noDevicesControl = await this.$("#nodevices");
        this.loadingDevicesControl = await this.$("#loadingdevices");
        this.fileDragOverElement = await this.$(".filedragover");

        if(!this.deviceControls || this.deviceControls.length == 0){
            UtilDOM.hide(this.devicesControl);
            UtilDOM.show(this.noDevicesControl);
            UtilDOM.show(this.loadingDevicesControl);
            return;
        }
        UtilDOM.hide(this.noDevicesControl);
        UtilDOM.hide(this.loadingDevicesControl);
        this.devicesControl.innerHTML = "";
        UtilDOM.show(this.devicesControl);
        for(const deviceControl of this.deviceControls){
            const deviceRender = await deviceControl.render();
            deviceRender.onclick = e => {
                //console.log("Clicked device",deviceControl.device);
                this.setSelectedDevice(deviceControl,true);
            }
            this.devicesControl.appendChild(deviceRender);
            UtilDOM.handleDroppedFiles(deviceRender, async files => {
                // UtilDOM.hide(this.fileDragOverElement);
                await deviceControl.requestPushFiles(files);
            },async ()=>{
                await this.setSelectedDevice(deviceControl,true,false);
                // UtilDOM.show(this.fileDragOverElement);
            });
        }
        return root;
    }
    hideNoDevices(){
        UtilDOM.hide(this.noDevicesControl);
    }
    getSelectedDevice(){
        return this.deviceControls.find(deviceControl=>deviceControl.isSelected);
    }
}
const deviceHtml = `<div class='device'>
                        <div class="deviceiconcontainer">
                            <img class='deviceicon'/>
                            <div class="devicelocalnetworkcontainer">
                                <svg class="devicelocalnetwork"  xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" version="1.1" width="24" height="24" viewBox="0 0 24 24"><path d="M10,2C8.89,2 8,2.89 8,4V7C8,8.11 8.89,9 10,9H11V11H2V13H6V15H5C3.89,15 3,15.89 3,17V20C3,21.11 3.89,22 5,22H9C10.11,22 11,21.11 11,20V17C11,15.89 10.11,15 9,15H8V13H16V15H15C13.89,15 13,15.89 13,17V20C13,21.11 13.89,22 15,22H19C20.11,22 21,21.11 21,20V17C21,15.89 20.11,15 19,15H18V13H22V11H13V9H14C15.11,9 16,8.11 16,7V4C16,2.89 15.11,2 14,2H10M10,4H14V7H10V4M5,17H9V20H5V17M15,17H19V20H15V17Z" /></svg>
                            </div>
                            <div class="devicewarningcontainer">
                                <svg class="devicewarning" xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512"><path fill="#E84849" d="M7.9,256C7.9,119,119,7.9,256,7.9C393,7.9,504.1,119,504.1,256c0,137-111.1,248.1-248.1,248.1C119,504.1,7.9,393,7.9,256z"></path><path fill="#EDC92C" d="M436.4,357.5L266.2,83.2c-2-3.2-5.5-5.1-9.2-5.1c-3.8,0-7.3,1.9-9.2,5.1L77,358.2c-2.1,3.4-2.2,7.6-0.3,11c1.9,3.4,5.6,5.6,9.5,5.6h341.3h0c6,0,10.9-4.9,10.9-10.9C438.5,361.5,437.7,359.3,436.4,357.5z"></path><path d="M244.3,261.4l-3.5-52.8c-0.7-10.3-1-17.7-1-22.2c0-6.1,1.6-10.9,4.8-14.3c3.2-3.4,7.4-5.1,12.6-5.1c6.3,0,10.6,2.2,12.7,6.6c2.1,4.4,3.2,10.7,3.2,18.9c0,4.9-0.3,9.8-0.8,14.8l-4.7,54.3c-0.5,6.5-1.6,11.4-3.3,14.9c-1.7,3.5-4.5,5.2-8.4,5.2c-4,0-6.7-1.7-8.3-5C246.1,273.3,245,268.2,244.3,261.4z M256.6,333.9c-4.5,0-8.4-1.4-11.7-4.3c-3.3-2.9-5-7-5-12.2c0-4.6,1.6-8.4,4.8-11.6c3.2-3.2,7.1-4.8,11.7-4.8c4.6,0,8.6,1.6,11.9,4.8c3.3,3.2,4.9,7.1,4.9,11.6c0,5.1-1.7,9.2-5,12.1C264.8,332.5,261,333.9,256.6,333.9z"></path></svg>
                            </div>
                        </div> 
                        <div colspan='2' class='devicename'>DEVICE_NAME</div>
                    </div>`
export class ControlDevice extends Control{
    constructor(device){
        super();
        this.device = device;
    }
    // getHtmlFile(){
    //     return "./v2/device/device.html";
    // }
    getHtml(){
        return deviceHtml;
    }
    async renderSpecific({root}){        
        this.root = root;
        this.deviceNameElement = await this.$(".devicename");
        this.deviceIconElement = await this.$(".deviceicon");
        this.deviceLocalNetworkElement = await this.$(".devicelocalnetworkcontainer");
        this.deviceWarningElement = await this.$(".devicewarningcontainer");

        this.deviceNameElement.innerHTML = this.device.isMyDevice ? `This Device (${this.device.deviceName})` : this.device.deviceName;
        this.deviceIconElement.src = this.device.getIcon();
        await this.setIsSelected(this.isSelected);
        this.updateLocalNetwork();
        return root;
    }
    async requestPushFiles(files){
        await EventBus.post(new RequestPushFiles({files,device:this.device}));
    }
    updateLocalNetwork(){
        UtilDOM.showOrHide(this.deviceLocalNetworkElement, this.device.canContactViaLocalNetwork);
        UtilDOM.showOrHide(this.deviceWarningElement, this.device.hasFixableIssue);
    }
    async setIsSelected(value,wasClick){
        this.isSelected = value;
        if(!this.root) return;

        if(value){
            await EventBus.postSticky(new SelectedDevice(this,wasClick));
            this.root.classList.add("selecteddevice");
        }else{            
            await EventBus.postSticky(new UnselectedDevice(this,wasClick));
            this.root.classList.remove("selecteddevice");
        }
    }
}
class SelectedDevice {
	constructor(controlDevice,wasClick){
        this.controlDevice = controlDevice;
        this.wasClick = wasClick;
	}
}
class UnselectedDevice {
	constructor(controlDevice,wasClick){
        this.controlDevice = controlDevice;
        this.wasClick = wasClick;
	}
}
class RequestPushFiles{
    constructor({files,device}){
        this.files = files;
        this.device = device;
    }
}