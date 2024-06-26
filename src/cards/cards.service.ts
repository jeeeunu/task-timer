import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { CreateCardDto } from './dto/card.dto';
import { UpdateCardDto, updateCommentDto } from './dto/update-card.dto';
import { Card } from 'src/entities/card.entity';
import { CardMember } from 'src/entities/card-member.entitiy';
import { Repository } from 'typeorm';
import { Card_comment } from 'src/entities/card-comment.entity';
import { User } from 'src/entities/user.entity';

@Injectable()
export class CardsService {
  constructor(
    @InjectRepository(Card)
    private cardRepository: Repository<Card>,

    @InjectRepository(Card_comment)
    private commentRepository: Repository<Card_comment>,

    @InjectRepository(CardMember)
    private cardMemberRepository: Repository<CardMember>,

    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  public async createCard(createCardDto: CreateCardDto, column_id: number) {
    const { card_name, description, card_color, deadline } = createCardDto;
    let position = await this.getLastPosition();
    if (!position) {
      position = 1000;
    }
    const result = await this.cardRepository.save({
      card_name,
      description,
      card_color,
      deadline,
      position: position + 1000,
      column_id,
    });
    return { result, message: '카드 생성에 성공했습니다.' };
  }

  public async showColumnCard(column_id: number) {
    const results: any = await this.cardRepository.find({
      where: { column_id },
      order: { deadline: 'ASC' },
    });

    let totalDurationInSeconds = 0;

    const formatDuration = (durationInSeconds: number) => {
      let durationInMinutes = Math.floor(durationInSeconds / 60);
      let durationInHours = Math.floor(durationInMinutes / 60);
      let durationInDays = Math.floor(durationInHours / 24);
      durationInHours %= 24;
      durationInMinutes %= 60;

      let durationString = '';
      if (durationInDays > 0) {
        durationString += `${durationInDays}일 `;
      }
      if (durationInHours > 0) {
        durationString += `${durationInHours}시간 `;
      }
      if (durationInMinutes > 0) {
        durationString += `${Math.round(durationInMinutes)}분`;
      }
      return durationString.trim();
    };

    results.map((result) => {
      let deadlineDate = new Date(result.deadline);
      result.deadline = deadlineDate.toLocaleString('ko-KR', {
        timeZone: 'Asia/Seoul',
      });

      if (result.completedAt === null) return;

      let completeDate = new Date(result.completedAt);
      result.completedAt = completeDate.toLocaleString('ko-KR', {
        timeZone: 'Asia/Seoul',
      });

      // Check if createdAt is not null
      if (result.duration !== null) {
        // Convert duration to seconds
        let durationInSeconds = result.duration / 1000;

        // Add duration to total
        totalDurationInSeconds += durationInSeconds;

        // Add duration string to the result
        result.duration = formatDuration(durationInSeconds);
      }
    });

    let totalDurationString = formatDuration(totalDurationInSeconds);

    return {
      message: '카드목록 조회에 성공했습니다',
      results,
      totalDuration: totalDurationString,
    };
  }

  public async getLastPosition() {
    const card = await this.cardRepository.find({
      order: { position: 'DESC' },
      take: 1,
    });
    if (card) {
    } else {
      return null;
    }
  }

  public async findCardDetail(card_id: number) {
    const result = await this.cardRepository.findOneBy({ id: card_id });
    if (!result) {
      throw new NotFoundException('존재하지 않는 카드입니다.');
    }
    return { message: '카드 조회에 성공했습니다', result };
  }

  public async updateCard(card_id: number, updateCardDto: UpdateCardDto) {
    const { card_name, description, card_color, deadline } = updateCardDto;
    const card = await this.cardRepository.findOneBy({ id: card_id });
    if (card_name) {
      card.card_name = card_name;
    }
    if (description) {
      card.description = description;
    }
    if (card_color) {
    }
    if (deadline) {
      card.deadline = deadline;
    }

    const result = await this.cardRepository.save(card);
    return { message: '카드정보 수정에 성공했습니다.', result };
  }

  public async updateCardPosition(
    card_id: number,
    column_id: number,
    prevPosition: number,
    nextPosition: number,
  ) {
    const targetCard = await this.cardRepository.findOneBy({ id: card_id });
    if (
      nextPosition - prevPosition === 1 ||
      (!prevPosition && nextPosition === 1)
    ) {
      const cards = await this.cardRepository
        .createQueryBuilder('cards')
        .select()
        .where('cards.position >= :position', { position: nextPosition })
        .getMany();
      for await (let card of cards) {
        card.position = card.position + 1000;
        await this.cardRepository.save(card);
      }
      nextPosition = nextPosition + 1000;
      targetCard.position = Math.ceil((prevPosition + nextPosition) / 2);
      await this.cardRepository.save(targetCard);
      return targetCard;
    } else if (!nextPosition) {
      targetCard.position = prevPosition + 1000;
      await this.cardRepository.save(targetCard);
      return targetCard;
    } else {
      targetCard.position = Math.ceil((prevPosition + nextPosition) / 2);
      await this.cardRepository.save(targetCard);
      return targetCard;
    }
  }

  public async createCardComment(card_id, user_id, comment) {
    const result = await this.commentRepository.save({
      comment,
      card: { id: card_id },
      user: { id: user_id },
    });
    return { message: '댓글이 작성되었습니다', result };
  }

  public async findCardComments(card_id: number) {
    const results = await this.commentRepository.find({ where: { card_id } });
    return results;
  }

  public async deleteCardComment(comment_id) {
    const result = await this.commentRepository.delete({ id: comment_id });
    if (!result) throw new NotFoundException('존재하지 않는 댓글입니다');
    return { message: '댓글이 삭제되었습니다' };
  }

  public async deleteCard(card_id) {
    await this.cardRepository.delete({ id: card_id });
    return { message: '카드가 삭제되었습니다' };
  }

  public async getMembers(card_id) {
    const members = await this.cardMemberRepository.find({
      where: { card: { id: card_id } },
      relations: ['user'],
    });

    const membersData = members.map((member) => ({
      id: member.user.id,
      username: member.user.username,
    }));

    return { message: '조회 완료', result: membersData };
  }

  public async addMember(card_id, user_email) {
    const user = await this.userRepository.findOne({
      where: { email: user_email },
    });

    if (!user) {
      return { message: '해당 이메일을 가진 유저를 찾을 수 없습니다.' };
    }

    const result = await this.cardMemberRepository.save({
      card: { id: card_id },
      user: { id: user.id },
    });

    return { message: '멤버가 추가되었습니다.', result };
  }

  //카드 댓글 수정
  async updateComment(data: updateCommentDto) {
    const { commentId, comment } = data;
    const found = await this.commentRepository.findOne({
      where: { id: commentId },
    });
    if (!found) throw new NotFoundException('코맨트를 찾을 수 없습니다');
    await this.commentRepository
      .createQueryBuilder()
      .update(Card_comment)
      .set({ comment })
      .where('id = :commentId', { commentId })
      .execute();
    return { message: '댓글이 수정되었습니다' };
  }

  //칼럼 완료하기
  async complete(id: number) {
    const card = await this.cardRepository.findOne({ where: { id } });

    console.log('%c ---> id: ', 'color:#0F0;', id);

    const duration =
      (new Date().getTime() - new Date(card.createdAt).getTime()) / 1000;

    await this.cardRepository
      .createQueryBuilder()
      .update(Card)
      .set({ completedAt: new Date(), duration })
      .where('id = :id', { id })
      .execute();
    return { status: true, message: '일정을 완료했습니다' };
  }
}
