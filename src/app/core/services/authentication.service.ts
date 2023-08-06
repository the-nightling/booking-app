import { Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { Observable, BehaviorSubject, tap } from "rxjs";
import { User } from "../models/user.model";
import { LoggedInUser } from "../models/logged-in-user.model";
import { environment } from "src/environments/environment";

@Injectable({
  providedIn: "root"
})
export class AuthenticationService {
  private loggedInUser: Observable<LoggedInUser | null>;
  private loggedInUserSubject: BehaviorSubject<LoggedInUser | null>;

  constructor(private httpClient: HttpClient) {
    let currentUser = sessionStorage.getItem("currentUser");
    this.loggedInUserSubject = new BehaviorSubject<LoggedInUser | null>(
      currentUser == null ? null : JSON.parse(currentUser)
    );
    this.loggedInUser = this.loggedInUserSubject.asObservable();
  }

  public get loggedInUserValue(): LoggedInUser | null {
    return this.loggedInUserSubject.value;
  }

  public getUser(): Observable<User> {
    return this.httpClient.get<any>(`${environment.apiUrl}/user`);
  }

  public login(
    username: string,
    password: string
  ): Observable<{ token: string; username: string }> {
    return this.httpClient
      .post<{ token: string; username: string }>(
        `${environment.apiUrl}/login`,
        {
          username: username,
          password: password
        }
      )
      .pipe(
        tap((result) => {
          sessionStorage.setItem("currentUser", JSON.stringify(result));
          this.loggedInUserSubject.next(result);

          return result;
        })
      );
  }

  public logout() {
    sessionStorage.removeItem("currentUser");
    this.loggedInUserSubject.next(null);
  }
}
