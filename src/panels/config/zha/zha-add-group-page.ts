import "@material/mwc-button";
import "@polymer/paper-input/paper-input";
import type { PaperInputElement } from "@polymer/paper-input/paper-input";
import "@polymer/paper-spinner/paper-spinner";
import {
  css,
  CSSResult,
  customElement,
  html,
  LitElement,
  property,
  PropertyValues,
  query,
} from "lit-element";
import type { HASSDomEvent } from "../../../common/dom/fire_event";
import { navigate } from "../../../common/navigate";
import type { SelectionChangedEvent } from "../../../components/data-table/ha-data-table";
import {
  addGroup,
  fetchGroupableDevices,
  ZHADevice,
  ZHAGroup,
} from "../../../data/zha";
import "../../../layouts/hass-error-screen";
import "../../../layouts/hass-subpage";
import type { PolymerChangedEvent } from "../../../polymer-types";
import type { HomeAssistant } from "../../../types";
import "../ha-config-section";
import "./zha-devices-data-table";
import type { ZHADevicesDataTable } from "./zha-devices-data-table";

@customElement("zha-add-group-page")
export class ZHAAddGroupPage extends LitElement {
  @property() public hass!: HomeAssistant;

  @property() public narrow!: boolean;

  @property() public devices: ZHADevice[] = [];

  @property() private _processingAdd = false;

  @property() private _groupName = "";

  @query("zha-devices-data-table")
  private _zhaDevicesDataTable!: ZHADevicesDataTable;

  private _firstUpdatedCalled = false;

  private _selectedDevicesToAdd: string[] = [];

  public connectedCallback(): void {
    super.connectedCallback();
    if (this.hass && this._firstUpdatedCalled) {
      this._fetchData();
    }
  }

  protected firstUpdated(changedProperties: PropertyValues): void {
    super.firstUpdated(changedProperties);
    if (this.hass) {
      this._fetchData();
    }
    this._firstUpdatedCalled = true;
  }

  protected render() {
    return html`
      <hass-subpage
        .header=${this.hass.localize("ui.panel.config.zha.groups.create_group")}
      >
        <ha-config-section .isWide=${!this.narrow}>
          <p slot="introduction">
            ${this.hass.localize(
              "ui.panel.config.zha.groups.create_group_details"
            )}
          </p>
          <paper-input
            type="string"
            .value="${this._groupName}"
            @value-changed=${this._handleNameChange}
            placeholder="${this.hass!.localize(
              "ui.panel.config.zha.groups.group_name_placeholder"
            )}"
          ></paper-input>

          <div class="header">
            ${this.hass.localize("ui.panel.config.zha.groups.add_members")}
          </div>

          <zha-devices-data-table
            .hass=${this.hass}
            .devices=${this.devices}
            .narrow=${this.narrow}
            selectable
            @selection-changed=${this._handleAddSelectionChanged}
          >
          </zha-devices-data-table>

          <div class="paper-dialog-buttons">
            <mwc-button
              .disabled="${!this._groupName ||
              this._groupName === "" ||
              this._processingAdd}"
              @click="${this._createGroup}"
              class="button"
            >
              <paper-spinner
                ?active="${this._processingAdd}"
                alt="${this.hass!.localize(
                  "ui.panel.config.zha.groups.creating_group"
                )}"
              ></paper-spinner>
              ${this.hass!.localize(
                "ui.panel.config.zha.groups.create"
              )}</mwc-button
            >
          </div>
        </ha-config-section>
      </hass-subpage>
    `;
  }

  private async _fetchData() {
    this.devices = await fetchGroupableDevices(this.hass!);
  }

  private _handleAddSelectionChanged(
    ev: HASSDomEvent<SelectionChangedEvent>
  ): void {
    this._selectedDevicesToAdd = ev.detail.value;
  }

  private async _createGroup(): Promise<void> {
    this._processingAdd = true;
    const group: ZHAGroup = await addGroup(
      this.hass,
      this._groupName,
      this._selectedDevicesToAdd
    );
    this._selectedDevicesToAdd = [];
    this._processingAdd = false;
    this._groupName = "";
    this._zhaDevicesDataTable.clearSelection();
    navigate(this, `/config/zha/group/${group.group_id}`, true);
  }

  private _handleNameChange(ev: PolymerChangedEvent<string>) {
    const target = ev.currentTarget as PaperInputElement;
    this._groupName = target.value || "";
  }

  static get styles(): CSSResult[] {
    return [
      css`
        .header {
          font-family: var(--paper-font-display1_-_font-family);
          -webkit-font-smoothing: var(
            --paper-font-display1_-_-webkit-font-smoothing
          );
          font-size: var(--paper-font-display1_-_font-size);
          font-weight: var(--paper-font-display1_-_font-weight);
          letter-spacing: var(--paper-font-display1_-_letter-spacing);
          line-height: var(--paper-font-display1_-_line-height);
          opacity: var(--dark-primary-opacity);
        }

        .button {
          float: right;
        }

        ha-config-section *:last-child {
          padding-bottom: 24px;
        }
        mwc-button paper-spinner {
          width: 14px;
          height: 14px;
          margin-right: 20px;
        }
        paper-spinner {
          display: none;
        }
        paper-spinner[active] {
          display: block;
        }
        .paper-dialog-buttons {
          align-items: flex-end;
          padding: 8px;
        }
        .paper-dialog-buttons .warning {
          --mdc-theme-primary: var(--google-red-500);
        }
      `,
    ];
  }
}
