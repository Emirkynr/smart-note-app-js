import React, { useState, useContext } from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import themes from "../themes";
import { ThemeContext } from "../contexts/ThemeContext";

export default function AiQuizBox({ quizData }) {
  const { theme } = useContext(ThemeContext);
  const colors = themes[theme];
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
    <View style={[
      styles.aiBox,
      { backgroundColor: colors.aiBoxBg, borderColor: colors.aiBoxBorder }
    ]} pointerEvents="box-none">
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
                { backgroundColor: colors.aiBoxBg },
                userAnswer !== undefined
                  ? isCorrect
                    ? { backgroundColor: colors.aiQuizCorrect }
                    : { backgroundColor: colors.aiQuizWrong }
                  : null,
                { borderWidth: 0 }
              ]}
            >
              <Pressable onPress={() => toggleExpand(idx)}>
                <Text style={[styles.quizQuestion, { color: colors.aiQuizQuestionText }]}>
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

                    // Cevaplanmışsa:
                    if (userAnswer !== undefined) {
                      return (
                        <Pressable
                          key={cidx}
                          style={[
                            styles.quizChoice,
                            {
                              backgroundColor: colors.aiQuizChoice,
                              borderColor: colors.aiQuizChoiceBorder,
                            },
                            userAnswer === choice
                              ? isCorrect
                                ? { backgroundColor: colors.aiQuizCorrect }
                                : { backgroundColor: colors.aiQuizWrong }
                              : showCorrect
                              ? { backgroundColor: colors.aiQuizCorrect }
                              : null,
                          ]}
                          onPress={() => {}}
                        >
                          <Text style={[styles.quizChoiceText, { color: colors.aiBoxContent }]}>{choice}</Text>
                        </Pressable>
                      );
                    }

                    // Cevaplanmamışsa:
                    return (
                      <Pressable
                        key={cidx}
                        style={[
                          styles.quizChoice,
                          {
                            backgroundColor: colors.aiQuizChoice,
                            borderColor: colors.aiQuizChoiceBorder,
                          },
                          userAnswer === choice ? { backgroundColor: colors.aiQuizWrong } : null,
                        ]}
                        onPress={() => userAnswer === undefined ? handlePress(idx, choice, q.answer) : undefined}
                      >
                        <Text style={[styles.quizChoiceText, { color: colors.aiBoxContent }]}>{choice}</Text>
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
    borderWidth: 0,
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