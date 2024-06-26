// 카드 생성 (모달창 열리며 column에 담긴 column_id를 심어줌)
document
  .getElementById('createCard')
  .addEventListener('shown.bs.modal', (event) => {
    const modalTriggerButton = event.relatedTarget;
    const column_id = modalTriggerButton.getAttribute('data-col-id');

    function createCard(column_id) {
      const card_name = document.querySelector('#card-name').value;
      const description = document.querySelector('#card-description').value;
      const deadline = document.querySelector('#date').value;
      if (!card_name || !description || !deadline) {
        alert('모든 값을 입력해주세요');
        return;
      }
      fetch(`/cards/create?column_id=${column_id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          card_name,
          description,
          deadline,
        }),
      })
        .then((res) => res.json())
        .then((data) => {
          alert(data.message);
        })
        .then(window.location.reload());
    }

    document
      .querySelector('.create-card-btn')
      .addEventListener('click', (event) => {
        createCard(column_id);
      });
  });

// 카드 상세 모달
document
  .getElementById('cardDetail')
  .addEventListener('shown.bs.modal', async (event) => {
    const modalTriggerButton = event.relatedTarget;
    const card_id = modalTriggerButton.getAttribute('data-card-id');

    const data = await fetch(`/cards/detail?card_id=${card_id}`);
    const cardData = await data.json();
    const cardDetail = cardData.result;
    const cardName = document.querySelector('.card-name');
    cardName.textContent = cardDetail.card_name;
    const cardDescription = document.querySelector('.card-description');
    cardDescription.textContent = cardDetail.description;
    const btnColumnComplete = document.querySelector('#btnComplete');
    btnColumnComplete.innerHTML = `
    <button type="button" class="btn btn-blue" id="btnComplete" data-col-id=${card_id} onclick="completeColumn()"> 일정 완료 </button>
`;
    btnColumnComplete.addEventListener('click', async function (e) {
      const colId = e.target.getAttribute('data-col-id');
      const response = await fetch(`/column/complete/${colId}`, {
        method: 'POST',
      });
      const { status } = response;
      const { message } = await response.json();

      if (status) {
        alert(message);
        return window.location.reload();
      }
    });

    // // 컬럼 완료
    // const completeColumn = async (e) => {
    //   console.log('%c ---> e: ', 'color:#0F0;', e);
    //
    // };

    const cardDeadline = document.querySelector('.card-deadline');
    cardDeadline.textContent = cardDetail.deadline;

    // 댓글 불러와서 innerHTML로 넣어주기
    const commentData = await (
      await fetch(`/cards/comments?card_id=${card_id}`)
    ).json();
    const commentList = document.querySelector('.comment-list');
    commentList.innerHTML = ``; // 다른카드 데이터 안남아있게 commentList 초기화
    let comment_temp = ``;
    for await (let data of commentData) {
      let comment = data.comment;
      let username = data.user.username;
      comment_temp += `<li class="comment-item">
      <strong class="user-id mb-3">${username} :</strong>
      <div class="comment-content">
        <div>
          <span class="user-comment"
            >${comment}</span
          >
        </div>
        <div class="btn-right">
          <button
            type="button"
            class="btn btn-outline-primary btn-comment-edit"
            style="
              --bs-btn-padding-y: 0.25rem;
              --bs-btn-padding-x: 0.5rem;
              --bs-btn-font-size: 0.75rem;
            " data-comment-id=${data.id}
          >
            수정
          </button>
          <button
            type="button"
            class="btn btn-outline-secondary comment-delete-btn"
            style="
              --bs-btn-padding-y: 0.25rem;
              --bs-btn-padding-x: 0.5rem;
              --bs-btn-font-size: 0.75rem;
            " data-comment-id=${data.id}
          >
            삭제
          </button>
        </div>
      </div>
      <div class="comment-edit-content">
        <div class="input-box">
          <input
            type="text"
            class="form-control"
            placeholder="수정할 댓글내용을 입력해주세요."
          />
          <button type="button" class="btn btn-dark comment-edit-btn"  data-comment-id=${data.id}>
            등록하기
          </button>
        </div>
      </div>
    </li>`;
      commentList.innerHTML = comment_temp;
    }

    //댓글 작성버튼
    document
      .querySelector('.write-comment-btn')
      .addEventListener('click', async (event) => {
        const comment = document.getElementById('comment-input').value;
        const response = await fetch(`/cards/comments?card_id=${card_id}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            comment: comment,
          }),
        });
        const data = await response.json();
        alert(data.message);
      });

    // 멤버 불러오기
    let member_temp = ``;
    const memberData = await (await fetch(`/cards/member/${card_id}`)).json();
    const memberList = document.querySelector('.card-member-list');
    memberData.result.forEach((ele) => {
      const username = ele.username;
      member_temp += `<li>${username}</li>`;
    });
    memberList.innerHTML = member_temp;

    //댓글 삭제 버튼
    const deleteBtn = document.querySelectorAll('.comment-delete-btn');
    deleteBtn.forEach((btn) => {
      btn.addEventListener('click', (event) => {
        const comment_id = event.target.getAttribute('data-comment-id');
        deleteComment(comment_id);
      });
    });
    //댓글 수정 버튼
    document.querySelectorAll('.comment-edit-btn').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        const commentId = e.target.getAttribute('data-comment-id');
        updateComment(e, commentId);
      });
    });
  });

//댓글 삭제 함수
async function deleteComment(comment_id) {
  const data = await (
    await fetch(`/cards/comments?comment_id=${comment_id}`, {
      method: 'DELETE',
    })
  ).json();
  alert(data.message);
}

//댓글 수정 함수
const updateComment = async (e, commentId) => {
  const comment = e.target.previousElementSibling.value;

  await fetch('/cards/comments', {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      commentId,
      comment,
    }),
  })
    .then((res) => res.json())
    .then((data) => {
      alert(data.message);
    })
    .then(window.location.reload());
};
