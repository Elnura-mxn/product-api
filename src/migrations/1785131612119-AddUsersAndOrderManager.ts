import { MigrationInterface, QueryRunner } from "typeorm";

export class AddUsersAndOrderManager1785131612119 implements MigrationInterface {
    name = 'AddUsersAndOrderManager1785131612119'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "users" ("id" SERIAL NOT NULL, "name" character varying NOT NULL, "surname" character varying NOT NULL, "email" character varying NOT NULL, "position" character varying, "password" character varying NOT NULL, "role" "public"."users_role_enum" NOT NULL DEFAULT 'user', "reset_password_token" character varying, "reset_password_expires" TIMESTAMP, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, CONSTRAINT "UQ_97672ac88f789774dd47f7c8be3" UNIQUE ("email"), CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "orders" ADD "manager_id" integer`);
        await queryRunner.query(`ALTER TABLE "orders" ADD CONSTRAINT "FK_c23c7d2f3f13590a845802393d5" FOREIGN KEY ("manager_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "orders" DROP CONSTRAINT "FK_c23c7d2f3f13590a845802393d5"`);
        await queryRunner.query(`ALTER TABLE "orders" DROP COLUMN "manager_id"`);
        await queryRunner.query(`DROP TABLE "users"`);
    }

}
