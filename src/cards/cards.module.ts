import { Module } from '@nestjs/common';
import { CardsService } from './cards.service';
import { CardsController } from './cards.controller';
import { Card } from '../entities/card.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Card_comment } from 'src/entities/card-comment.entity';
import { CardMember } from 'src/entities/card-member.entitiy';
import { User } from '../entities/user.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Card]),
    TypeOrmModule.forFeature([Card_comment]),
    TypeOrmModule.forFeature([CardMember]),
    TypeOrmModule.forFeature([User]),
  ],
  controllers: [CardsController],
  providers: [CardsService],
  exports: [CardsService],
})
export class CardsModule {}
