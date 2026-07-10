import { useCallback, useEffect, useState } from "react";
import type { StudentMcqQuestion } from "../../data/studentFlowQuestionAdapter";

type McqTrainerPreviewProps = {
  question: StudentMcqQuestion;
};

function shuffleArray(array: string[]) {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export default function McqTrainerPreview({ question }: McqTrainerPreviewProps) {
  const [shuffledOptions, setShuffledOptions] = useState<string[]>([]);
  const [selectedAnswer, setSelectedAnswer] = useState("");
  const [isAnswered, setIsAnswered] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [score, setScore] = useState(question.score);

  useEffect(() => {
    setShuffledOptions(shuffleArray(question.options));
    setSelectedAnswer("");
    setIsAnswered(false);
    setIsCorrect(false);
    setScore(question.score);
  }, [question.Qn_name, question.options, question.score]);

  const handleSubmit = useCallback(() => {
    const correct = selectedAnswer === question.correct_answer;
    setIsCorrect(correct);
    setIsAnswered(true);
    const total = Number(question.score.split("/")[1] || question.score);
    setScore(correct ? `${total}/${total}` : `0/${total}`);
  }, [question.correct_answer, question.score, selectedAnswer]);

  return (
    <div className="d-flex flex-column h-100">
      <div className="d-flex justify-content-end mb-2">
        <span className="p-2 fs-6 rounded-2 bg-primary-subtle d-flex flex-column small">
          <span>Topic: {question.topic_name}</span>
          <span>Sub topic: {question.subtopic_name}</span>
          <span>QID: {question.question_id}</span>
        </span>
      </div>

      <div
        className="border border-muted flex-grow-1"
        style={{
          overflow: "auto",
          boxShadow: "#00000033 0px 0px 5px 0px inset",
        }}
      >
        <div className="p-3">
          <div className="d-flex justify-content-between mb-3">
            <div
              style={{
                whiteSpace: "pre-wrap",
                wordWrap: "break-word",
                width: "70%",
                fontSize: "16px",
                lineHeight: "1.6",
              }}
            >
              {question.question}
            </div>
            <div
              style={{
                fontSize: "16px",
                fontWeight: 600,
                whiteSpace: "nowrap",
                minWidth: "120px",
                textAlign: "right",
              }}
            >
              Score : {score}
            </div>
          </div>

          <div className="row g-2">
            {shuffledOptions.map((option, index) => {
              const isSelected = selectedAnswer === option;
              const isCorrectOption = option === question.correct_answer;

              let bgColor = "";
              if (!isAnswered) {
                bgColor = isSelected ? "#E0E0E0" : "";
              } else if (isCorrectOption) {
                bgColor = "#BAFFCE";
              } else if (isSelected) {
                bgColor = "#FFC9C9";
              }

              return (
                <div key={option} className="col-6 d-flex align-items-center mb-2">
                  <div className="me-2 mx-3" style={{ fontWeight: 600 }}>
                    {String.fromCharCode(65 + index)}.
                  </div>
                  <button
                    type="button"
                    className="btn px-2 py-1 rounded-2 border border-muted"
                    style={{
                      backgroundColor: bgColor,
                      width: "100%",
                      whiteSpace: "pre-wrap",
                      textAlign: "left",
                      boxShadow: "#00000033 0px 5px 4px",
                    }}
                    onClick={() => {
                      if (!isAnswered) setSelectedAnswer(option);
                    }}
                    disabled={isAnswered}
                  >
                    {option}
                  </button>
                </div>
              );
            })}
          </div>

          {isAnswered ? (
            <button
              type="button"
              className="btn btn-outline-light mt-3 roadmap-button text-light"
              disabled
            >
              Submitted
            </button>
          ) : (
            <button
              type="button"
              className="btn btn-outline-light mt-3 roadmap-button text-light"
              onClick={handleSubmit}
              disabled={!selectedAnswer}
            >
              Submit
            </button>
          )}

          {isAnswered && question.Explanation && (
            <div
              className="mt-4 border rounded-2 p-2"
              style={{ boxShadow: "#00000033 0px 5px 4px" }}
            >
              <strong>Explanation:</strong>
              <div className="mt-2">{question.Explanation}</div>
              {!isCorrect && (
                <div className="mt-2 text-danger small">
                  Trainer note: verify distractors and wording before publishing.
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
