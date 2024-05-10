import { MigrationInterface, QueryRunner } from "typeorm";

export class Migrations1715164786351 implements MigrationInterface {
  name = "Migrations1715164786351";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "transactions" ALTER COLUMN "gasPrice" DROP NOT NULL`);
    await queryRunner.query(`ALTER TABLE "transactionReceipts" ALTER COLUMN "gasUsed" DROP NOT NULL`);
    await queryRunner.query(`ALTER TABLE "transactionReceipts" ALTER COLUMN "effectiveGasPrice" DROP NOT NULL`);
    await queryRunner.query(`ALTER TABLE "transactionReceipts" ALTER COLUMN "cumulativeGasUsed" DROP NOT NULL`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "transactionReceipts" ALTER COLUMN "cumulativeGasUsed" SET NOT NULL`);
    await queryRunner.query(`ALTER TABLE "transactionReceipts" ALTER COLUMN "effectiveGasPrice" SET NOT NULL`);
    await queryRunner.query(`ALTER TABLE "transactionReceipts" ALTER COLUMN "gasUsed" SET NOT NULL`);
    await queryRunner.query(`ALTER TABLE "transactions" ALTER COLUMN "gasPrice" SET NOT NULL`);
  }
}
