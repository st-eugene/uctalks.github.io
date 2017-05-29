import { Component, EventEmitter, Input, Output } from '@angular/core';
import { MdSelectChange } from '@angular/material';
import User from '../user/user.interface';

@Component({
  selector: 'app-user-dropdown',
  template: `
    <md-select
      name="user"
      placeholder="Speaker"
      floatPlaceholder="never"
      [disabled]="disabled"
      [(ngModel)]="selectedSpeakerId"
      (change)="emitSpeakerSelectEvent($event)">
      <md-option *ngFor="let user of users" [value]="user._id">
        {{user.name}}
      </md-option>
    </md-select>
  `,
  styleUrls: ['./user-dropdown.component.scss'],
})
export class UserDropdownComponent {
  @Input() users: User[];
  @Input() selectedSpeakerId: string;
  @Input() disabled: boolean;
  @Output() speakerSelected: EventEmitter<string>;

  constructor() {
    this.speakerSelected = new EventEmitter();
  }

  public emitSpeakerSelectEvent(event: MdSelectChange): void {
    this.speakerSelected.emit(event.value);
  }
}
