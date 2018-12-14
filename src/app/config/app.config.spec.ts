/**
 * Copyright 2017 - 2018  The Hyve B.V.
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import {TestBed, inject} from '@angular/core/testing';
import {AppConfig} from './app.config';
import {HttpClientModule, HttpErrorResponse} from '@angular/common/http';
import {HttpClientTestingModule, HttpTestingController} from '@angular/common/http/testing';
import {MessageHelper} from '../utilities/message-helper';
import {Observable} from 'rxjs/Observable';

describe('AppConfig', () => {
  let appConfig: AppConfig;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        HttpClientModule,
        HttpClientTestingModule
      ],
      providers: [
        AppConfig
      ]
    });
    appConfig = TestBed.get(AppConfig);
    httpMock = TestBed.get(HttpTestingController);
  });

  it('should be injected', inject([AppConfig], (service: AppConfig) => {
    expect(service).toBeTruthy();
  }));

  it('should get the config value with its key, return null if absent', () => {
    appConfig.config = {
      foo: 'bar'
    };
    let val = appConfig.getConfig('foo');
    expect(val).toBe('bar');
    val = appConfig.getConfig('sth else');
    expect(val).toBe(null);
  });

  it('should get the env from config', () => {
    appConfig.env = {
      env: 'foobar'
    };
    let val = appConfig.getEnv();
    expect(val).toBe('foobar');
  });

  it('should load the correct config json file', () => {
    AppConfig.path = 'somepath/';
    let dummyEnvResponse = {
      env: 'dev',
      foo: 'bar'
    };
    let dummyConfigResponse = {
      bar: 'foo'
    };
    let spy = spyOn(appConfig.http, 'get').and.callThrough();
    let spyMessage = spyOn(MessageHelper, 'alert');
    appConfig.load();
    httpMock.expectOne(AppConfig.path + 'env.json').flush(dummyEnvResponse);
    httpMock.expectOne(AppConfig.path + 'config.' + dummyEnvResponse.env + '.json').flush(dummyConfigResponse);
    expect(spy).toHaveBeenCalledTimes(2);
    expect(spyMessage).toHaveBeenCalledTimes(0);
  });

  it('should return the version from the json file', () => {
    AppConfig.path = 'somepath/';
    let configResponse = {
      'app-version': '0.0.1-test'
    };
    let spy = spyOn(appConfig.http, 'get').and.callThrough();
    appConfig.load();
    httpMock.expectOne(AppConfig.path + 'env.json').flush({env: 'dev'});
    httpMock.expectOne(AppConfig.path + 'config.dev.json').flush(configResponse);
    expect(spy).toHaveBeenCalledTimes(2);
    expect(appConfig.getConfig('app-version')).toEqual('0.0.1-test');
  });

  it('should not load config file when env is wrong', () => {
    AppConfig.path = 'somepath/';
    let dummyEnvResponse = {
      env: 'sth.wrong',
      foo: 'bar'
    };
    let spy = spyOn(appConfig.http, 'get').and.callThrough();
    let spyMessage = spyOn(MessageHelper, 'alert');
    appConfig.load();
    httpMock.expectOne(AppConfig.path + 'env.json').flush(dummyEnvResponse);
    httpMock.expectNone(AppConfig.path + 'config.' + dummyEnvResponse.env + '.json');
    expect(spy).toHaveBeenCalledTimes(1);
    expect(spyMessage).toHaveBeenCalledTimes(1);
  });

  it('should report error when retrieving env.json fails', () => {
    let errorResponse = {
      status: 404,
      statusText: 'bad request'
    };
    AppConfig.path = 'somepath/';
    let spy = spyOn(appConfig.http, 'get').and.callThrough();
    let spyMessage = spyOn(MessageHelper, 'alert');
    appConfig.load();
    httpMock.expectOne(AppConfig.path + 'env.json').flush('cannot load env json', errorResponse);
    expect(spy).toHaveBeenCalledTimes(1);
    expect(spyMessage).toHaveBeenCalledTimes(1);
  });

  it('should report error  when retrieving config json fails', () => {
    AppConfig.path = 'somepath/';
    let dummyEnvResponse = {
      env: 'dev',
      foo: 'bar'
    };
    let errorResponse = {
      status: 404,
      statusText: 'bad request'
    };
    let spy = spyOn(appConfig.http, 'get').and.callThrough();
    let spyMessage = spyOn(MessageHelper, 'alert');
    appConfig.load();
    httpMock.expectOne(AppConfig.path + 'env.json').flush(dummyEnvResponse);
    httpMock.expectOne(AppConfig.path + 'config.' + dummyEnvResponse.env + '.json')
      .flush('cannot load config json', errorResponse);
    expect(spy).toHaveBeenCalledTimes(2);
    expect(spyMessage).toHaveBeenCalledTimes(1);
  });

  it('should get the default value when the given key is present', () => {
    appConfig.config = {};
    try {
      appConfig.getConfig('api-url');
      fail('The call to get api-url config should not succeed.');
    } catch (e) {
      expect(e.message).toBeDefined();
    }
    try {
      appConfig.getConfig('fractalis-url');
      fail('The call to get fractalis-url config should not succeed.');
    } catch (e) {
      expect(e.message).toBeDefined();
    }
    try {
      appConfig.getConfig('fractalis-datasource-url');
      fail('The call to get fractalis-datasource-url config should not succeed.');
    } catch (e) {
      expect(e.message).toBeDefined();
    }
    expect(appConfig.getConfig('api-version')).toBe(AppConfig.DEFAULT_API_VERSION);
    expect(appConfig.getConfig('app-url')).toBe(AppConfig.DEFAULT_APP_URL);
    expect(appConfig.getConfig('app-version')).toBe(AppConfig.DEFAULT_APP_VERSION);
    expect(appConfig.getConfig('doc-url')).toBe(AppConfig.DEFAULT_DOC_URL);
    expect(appConfig.getConfig('autosave-subject-sets')).toBe(AppConfig.DEFAULT_AUTOSAVE_SUBJECT_SETS);
    expect(appConfig.getConfig('export-mode')['name']).toBe(AppConfig.DEFAULT_EXPORT_MODE['name']);
    expect(appConfig.getConfig('export-mode')['data-view']).toBe(AppConfig.DEFAULT_EXPORT_MODE['data-view']);
    expect(appConfig.getConfig('show-observation-counts')).toBe(AppConfig.DEFAULT_SHOW_OBSERVATIONS_COUNTS);
    expect(appConfig.getConfig('instant-counts-update')).toBe(AppConfig.DEFAULT_INSTANT_COUNTS_UPDATE);
    expect(appConfig.getConfig('include-data-table')).toBe(AppConfig.DEFAULT_INCLUDE_DATA_TABLE);
    expect(appConfig.getConfig('include-cohort-subscription')).toBe(AppConfig.DEFAULT_INCLUDE_COHORT_SUBSCRIPTION);
    expect(appConfig.getConfig('authentication-service-type')).toBe(AppConfig.DEFAULT_AUTHENTICATION_SERVICE_TYPE);
    expect(appConfig.getConfig('oidc-server-url')).toBe(AppConfig.DEFAULT_OIDC_SERVER_URL);
    expect(appConfig.getConfig('oidc-client-id')).toBe(AppConfig.DEFAULT_OIDC_CLIENT_ID);
  })

});
