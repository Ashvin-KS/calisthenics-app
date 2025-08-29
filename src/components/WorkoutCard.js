import React from 'react';
import { Target, CheckCircle, Circle } from 'lucide-react';

const WorkoutCard = ({ exercise, isCompleted, onToggle, index }) => {
  return (
    <div className={`exercise-card ${isCompleted ? 'completed' : ''}`}>
      <div className="exercise-header">
        <button className="exercise-checkbox" onClick={() => onToggle(index)}>
          {isCompleted ? 
            <CheckCircle className="check-icon completed" /> : 
            <Circle className="check-icon" />
          }
        </button>
        <div className="exercise-info">
          <h3 className="exercise-name">{exercise.name}</h3>
          <div className="exercise-meta">
            <span className="exercise-sets">{exercise.sets} sets</span>
            <span className="exercise-reps">{exercise.reps} reps</span>
          </div>
        </div>
      </div>
      <div className="exercise-targets">
        <Target className="target-icon" />
        <span>{exercise.targets}</span>
      </div>
      <div className="exercise-description">
        {exercise.description}
      </div>
    </div>
  );
};

export default WorkoutCard;
