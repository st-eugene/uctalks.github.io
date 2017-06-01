import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import 'rxjs/add/operator/filter';
import auth0 from 'auth0-js';
import { MdSnackBar } from '@angular/material';
import { AUTH_CONFIG } from './auth-config';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import { UserService } from '../user-service/user.service';

@Injectable()
export class AuthService {
  // observable to track receipt of the user's details
  public profileDetailsReceived$ = new BehaviorSubject(!!this.userProfileId);

  // observable to track new login event
  public newLogin$ = new BehaviorSubject(null);

  // Configure Auth0
  public auth0 = new auth0.WebAuth(AUTH_CONFIG);

  constructor(public router: Router, private snackBar: MdSnackBar, private userService: UserService) {}

  public login(): void {
    // Call the show method to display the widget.
    this.auth0.authorize({ connection: 'google-oauth2', prompt: 'select_account' });
  }

  public handleAuthentication(): void {
    this.auth0.parseHash(null, (err, authResult) => {
      if (err) {
        this.snackBar.open(err.errorDescription, 'close', { duration: 4000 });
        console.error(err);
      } else if (authResult && authResult.accessToken && authResult.idToken) {
        window.location.hash = '';
        this.setSession(authResult);
      }
      this.router.navigate(['/']);
    });
  }

  private setSession(authResult): void {
    // Set the time that the access token will expire at
    const expiresAt = JSON.stringify((authResult.expiresIn * 1000) + new Date().getTime());
    localStorage.setItem('access_token', authResult.accessToken);
    localStorage.setItem('id_token', authResult.idToken);
    localStorage.setItem('expires_at', expiresAt);

    // get more user details
    this.auth0.client.userInfo(authResult.accessToken, (err, profile) => {
      if (err) {
        this.snackBar.open('Cannot get user profile', 'close', { duration: 3000 });
      } else if (profile) {
        this.snackBar.open(`Hello, ${profile.given_name}! You are loggen in`, 'close', { duration: 2000 });

        const { name, sub, picture } = profile;

        // store user details
        localStorage.setItem('userName', name);
        localStorage.setItem('userPicture', picture);

        // notify subscribers, that user has logged in
        this.profileDetailsReceived$.next(true);

        // add/update user in the database
        this.userService.addOrUpdateUser({ name, sub, picture }).subscribe(
          user => {
            this.newLogin$.next(user);
            localStorage.setItem('userId', user._id);
          },
          () => this.snackBar.open('Cannot post new login data', 'close', { duration: 3000 }),
        );
      }
    });
  }

  public logout(): void {
    // notify subscribers that user has logged out
    this.profileDetailsReceived$.next(false);

    // Remove tokens and expiry time from localStorage
    localStorage.removeItem('access_token');
    localStorage.removeItem('id_token');
    localStorage.removeItem('expires_at');
    localStorage.removeItem('userId');
    localStorage.removeItem('userName');
    localStorage.removeItem('userPicture');

    // Go back to the home route
    this.router.navigate(['/']);
  }

  public get isAuthenticated(): boolean {
    // Check whether the current time is past the
    // access token's expiry time
    const expiresAt = JSON.parse(localStorage.getItem('expires_at'));
    return new Date().getTime() < expiresAt;
  }

  public get userProfileId(): string | null {
    return localStorage.getItem('userId');
  }

  public get userProfileName(): string | null {
    return localStorage.getItem('userName');
  }

  public get userProfilePicture(): string | null {
    return localStorage.getItem('userPicture');
  }
}
