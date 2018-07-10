/**
 * Copyright 2017 - 2018  The Hyve B.V.
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import {Injectable, Injector, OnDestroy} from '@angular/core';
import {AppConfig} from '../../config/app.config';
import {Observable} from 'rxjs/Observable';
import {AuthenticationMethod} from './authentication-method';
import {Oauth2Authentication} from './oauth2-authentication';
import {AuthorisationResult} from './authorisation-result';
import {AsyncSubject} from 'rxjs/AsyncSubject';

@Injectable()
export class AuthenticationService implements OnDestroy {

  private config: AppConfig;
  private authenticationMethod: AuthenticationMethod;

  constructor(private injector: Injector) { }

  public load(): Promise<AuthorisationResult> {
    this.config = this.injector.get(AppConfig);
    this.authenticationMethod = this.injector.get(Oauth2Authentication);
    return this.authenticationMethod.load();
  }

  ngOnDestroy(): void {
    this.authenticationMethod.onDestroy();
  }

  authorise(): Observable<AuthorisationResult> {
    return this.authenticationMethod.authorisation;
  }

  logout() {
    this.authenticationMethod.logout();
  }

  get authorised(): AsyncSubject<boolean> {
    return this.authenticationMethod.authorised;
  }

  get validToken(): boolean {
    return this.authenticationMethod.validToken;
  }

  get token(): string {
    return this.authenticationMethod.token;
  }

}