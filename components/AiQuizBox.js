import React, { useState } from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";

export default function AiQuizBox({ quizData }) {
  const [answers, setAnswers] = useState({});
  const [results, setResults] = useState({});
  const [expanded, setExpanded] = useState({});

  if (!quizData || !Array.isArray(quizData) || quizData.length === 0) {
    return null;
  }

  const handlePress = (qIdx, choice, correctAnswer) => {
    setAnswers((prev) => ({ ...prev, [qIdx]: choice }));
    setResults((prev) => ({
      ...prev,
      [qIdx]: choice === correctAnswer,
    }));
  };

  const toggleExpand = (idx) => {
    setExpanded((prev) => ({ ...prev, [idx]: !prev[idx] }));
  };

  return (
    <View style={styles.aiBox} pointerEvents="box-none">
      <Text style={styles.aiBoxTitle} pointerEvents="none">AI Quiz</Text>
      <View>
        {quizData.map((q, idx) => {
          const userAnswer = answers[idx];
          const isCorrect = results[idx];
          const isExpanded = expanded[idx] ?? false;
          return (
            <View
              key={idx}
              style={[
                styles.quizQuestionBox,
                userAnswer !== undefined
                  ? isCorrect
                    ? styles.quizCorrect
                    : styles.quizWrong
                  : null,
              ]}
            >
              <Pressable onPress={() => toggleExpand(idx)}>
                <Text style={styles.quizQuestion}>
                  {idx + 1}. {q.question}{" "}
                  <Text style={{ fontSize: 14 }}>
                    {isExpanded ? "▲" : "▼"}
                  </Text>
                </Text>
              </Pressable>
              {isExpanded && (
                <View>
                  {q.choices.map((choice, cidx) => {
                    const showCorrect =
                      userAnswer !== undefined &&
                      !isCorrect &&
                      choice === q.answer;

                    // Cevaplanmışsa: dummy Pressable (scroll için)
                    if (userAnswer !== undefined) {
                      return (
                        <Pressable
                          key={cidx}
                          style={[
                            styles.quizChoice,
                            userAnswer === choice
                              ? isCorrect
                                ? styles.quizSelectedCorrect
                                : styles.quizSelectedWrong
                              : showCorrect
                              ? styles.quizShowCorrect
                              : null,
                          ]}
                          onPress={() => {}} // dummy, tıklama yok
                        >
                          <Text style={styles.quizChoiceText}>{choice}</Text>
                        </Pressable>
                      );
                    }

                    // Cevaplanmamışsa Pressable olarak bırak
                    return (
                      <Pressable
                        key={cidx}
                        style={[
                          styles.quizChoice,
                          userAnswer === choice ? styles.quizSelectedWrong : null,
                        ]}
                        onPress={() => handlePress(idx, choice, q.answer)}
                      >
                        <Text style={styles.quizChoiceText}>{choice}</Text>
                      </Pressable>
                    );
                  })}
                </View>
              )}
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  aiBox: {
    backgroundColor: "#e3f2fd",
    borderRadius: 10,
    padding: 12,
    marginTop: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#90caf9",
  },
  aiBoxTitle: {
    fontWeight: "bold",
    fontSize: 16,
    color: "#1976d2",
    marginBottom: 6,
  },
  quizQuestionBox: {
    marginBottom: 16,
    padding: 10,
    borderRadius: 8,
    backgroundColor: "#f5f5f5",
  },
  quizCorrect: {
    backgroundColor: "#a5d6a7",
  },
  quizWrong: {
    backgroundColor: "#ff5252",
  },
  quizQuestion: {
    fontWeight: "bold",
    marginBottom: 8,
    fontSize: 15,
  },
  quizChoice: {
    padding: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#90caf9",
    marginBottom: 6,
    backgroundColor: "#fff",
  },
  quizSelectedCorrect: {
    backgroundColor: "#b9f6ca",
  },
  quizSelectedWrong: {
    backgroundColor: "#ff8a80",
  },
  quizShowCorrect: {
    backgroundColor: "#b9f6ca",
  },
  quizChoiceText: {
    fontSize: 15,
  },
});