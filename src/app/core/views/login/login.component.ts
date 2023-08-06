import { Component } from "@angular/core";
import { Router } from "@angular/router";
import { FormControl, FormGroup, Validators } from "@angular/forms";
import { AuthenticationService } from "../../services/authentication.service";
import { first } from "rxjs";

@Component({
  selector: "app-login",
  templateUrl: "./login.component.html",
  styleUrls: ["./login.component.scss"]
})
export class LoginComponent {
  protected loginForm = new FormGroup({
    username: new FormControl("", Validators.required),
    password: new FormControl("", Validators.required)
  });

  constructor(
    private authenticationService: AuthenticationService,
    private router: Router
  ) {}

  submitLogin() {
    if (this.loginForm.valid) {
      let username = this.loginForm.controls.username.value!;
      let password = this.loginForm.controls.password.value!;

      this.authenticationService
        .login(username, password)
        .pipe(first())
        .subscribe({
          next: () => this.router.navigate(["/home"]),
          error: (err) => console.log(err)
        });
    }
  }
}
