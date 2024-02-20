import { LoginService } from "data-access/login.service";
import { FirebotController } from "../misc/firebot-controller.decorator";
import { Delete, Get, Param, Post, Query } from "@nestjs/common";
import { FirebotAccountType } from "firebot-types";

@FirebotController({
  path: "login",
})
export class LoginController {
  constructor(private readonly loginService: LoginService) {}

  @Get("all")
  async getAllLogins() {
    return this.loginService.getAllPlatformLogins();
  }

  @Post(":platformId/active")
  async setActiveLoginConfig(
    @Param("platformId")
    platformId: string,
    @Query("loginConfigId")
    loginConfigId: string
  ): Promise<boolean> {
    return this.loginService.setActiveLoginConfig(platformId, loginConfigId);
  }

  @Post(":platformId")
  async createLoginForPlatform(
    @Param("platformId") platformId: string
  ): Promise<unknown> {
    return this.loginService.createLoginForPlatform(platformId);
  }

  @Delete(":platformId/:loginConfigId")
  async deleteLoginForPlatform(
    @Param("platformId") platformId: string,
    @Param("loginConfigId") loginConfigId: string
  ): Promise<boolean> {
    return this.loginService.deleteLoginForPlatform(platformId, loginConfigId);
  }

  @Delete(":platformId/:loginConfigId/:accountType")
  async deleteAccountForLoginForPlatform(
    @Param("platformId") platformId: string,
    @Param("loginConfigId") loginConfigId: string,
    @Param("accountType") accountType: FirebotAccountType
  ): Promise<boolean> {
    return this.loginService.deleteAccountForLoginForPlatform(
      platformId,
      loginConfigId,
      accountType
    );
  }
}