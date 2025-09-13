import React, { useState, useEffect } from 'react';
import { Calendar, Dumbbell, Target, Clock, Trophy, User, Settings, Play, Pause, CheckCircle, Circle, RotateCcw, X } from 'lucide-react';
import { workoutData } from './data/workoutData';
import './App.css';
import TargetCursor from './components/TargetCursor';

const App = () => {
  const [currentDay, setCurrentDay] = useState(new Date().toLocaleDateString('en-US', { weekday: 'long' }));
  const [completedExercises, setCompletedExercises] = useState(() => {
    const saved = localStorage.getItem('completedExercises');
    const initial = saved ? JSON.parse(saved) : {};
    // Initialize sets completion for all exercises based on workoutData
    Object.keys(workoutData).forEach(day => {
      workoutData[day].exercises.forEach((exercise, exerciseIndex) => {
        const key = `${day}-${exerciseIndex}`;
        // Ensure that if an exercise is added or removed, or sets change, the state is re-initialized
        // Also, ensure all sets are initially false if not saved or if structure changed
        if (!initial[key] || !Array.isArray(initial[key]) || initial[key].length !== exercise.sets) {
          initial[key] = Array(exercise.sets).fill(false);
        }
      });
    });
    console.log('Initial completedExercises state:', initial);
    return initial;
  });
  const [customReps, setCustomReps] = useState(() => {
    const saved = localStorage.getItem('customReps');
    return saved ? JSON.parse(saved) : {};
  });
  const [workoutTimer, setWorkoutTimer] = useState(0);
  const [isTimerActive, setIsTimerActive] = useState(false);
  const [stats, setStats] = useState(() => {
    const saved = localStorage.getItem('stats');
    return saved ? JSON.parse(saved) : {
      totalWorkouts: 0,
      totalTime: 0,
      currentStreak: 0,
      lastCompletedDate: null,
      completedToday: false
    };
  });
  const [workoutCompletedToday, setWorkoutCompletedToday] = useState(() => {
    const savedStats = localStorage.getItem('stats');
    if (savedStats) {
      const parsedStats = JSON.parse(savedStats);
      const today = new Date().toLocaleDateString('en-US');
      const lastCompleted = parsedStats.lastCompletedDate ? new Date(parsedStats.lastCompletedDate).toLocaleDateString('en-US') : null;
      return parsedStats.completedToday && lastCompleted === today;
    }
    return false;
  });
  const [selectedVideo, setSelectedVideo] = useState(null);

  const getEmbedUrl = (url) => {
    if (!url) return '';
    if (url.includes('/shorts/')) {
      return url.replace('/shorts/', '/embed/');
    }
    return url.replace('watch?v=', 'embed/');
  };

  // Helper function to get the current week number
  const getWeekNumber = (date) => {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
  };

  // Weekly reset effect
  useEffect(() => {
    const lastWeek = localStorage.getItem('lastWeek');
    const currentWeek = getWeekNumber(new Date()).toString();

    if (lastWeek !== currentWeek) {
      localStorage.removeItem('completedExercises');
      setCompletedExercises({});
      localStorage.setItem('lastWeek', currentWeek);
    }
  }, []);

  // Save to localStorage
  useEffect(() => {
    localStorage.setItem('completedExercises', JSON.stringify(completedExercises));
  }, [completedExercises]);

  useEffect(() => {
    localStorage.setItem('stats', JSON.stringify(stats));
  }, [stats]);

  useEffect(() => {
    localStorage.setItem('customReps', JSON.stringify(customReps));
  }, [customReps]);

  // Timer effect
  useEffect(() => {
    let interval = null;
    if (isTimerActive) {
      interval = setInterval(() => {
        setWorkoutTimer(timer => timer + 1);
      }, 1000);
    }
    return () => {
      clearInterval(interval);
    };
  }, [isTimerActive]);

  // Format time
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Toggle set completion
  const toggleSetCompletion = (exerciseIndex, setIndex) => {
    const key = `${currentDay}-${exerciseIndex}`;
    setCompletedExercises(prev => {
      const newCompletedSets = [...(prev[key] || [])];
      newCompletedSets[setIndex] = !newCompletedSets[setIndex];
      console.log(`Toggling set ${setIndex} for exercise ${exerciseIndex} on ${currentDay}. New state:`, newCompletedSets);
      return {
        ...prev,
        [key]: newCompletedSets
      };
    });
  };

  // Handle rep adjustment
  const handleRepAdjustment = (exerciseIndex, delta) => {
    const key = `${currentDay}-${exerciseIndex}`;
    setCustomReps(prev => {
      const currentReps = parseInt(prev[key] || workoutData[currentDay].exercises[exerciseIndex].reps.split('-')[0], 10);
      const newReps = Math.max(1, currentReps + delta); // Ensure reps don't go below 1
      return {
        ...prev,
        [key]: newReps.toString()
      };
    });
  };

  // Toggle all sets for an exercise
  const toggleExerciseCompletion = (exerciseIndex) => {
    const key = `${currentDay}-${exerciseIndex}`;
    setCompletedExercises(prev => {
      const currentSets = prev[key] || [];
      const allCompleted = currentSets.every(Boolean);
      const newCompletedSets = Array(currentSets.length).fill(!allCompleted);
      
      // Only update if there's a change to prevent unnecessary re-renders/recalculations
      if (JSON.stringify(currentSets) === JSON.stringify(newCompletedSets)) {
        return prev;
      }

      return {
        ...prev,
        [key]: newCompletedSets
      };
    });
  };

  // Complete workout
  const completeWorkout = () => {
    const today = new Date();
    const todayDateString = today.toLocaleDateString('en-US');

    setStats(prev => {
      let newStreak = prev.currentStreak;
      let newTotalWorkouts = prev.totalWorkouts;
      const lastDate = prev.lastCompletedDate ? new Date(prev.lastCompletedDate) : null;

      if (!workoutCompletedToday) { // Only increment totalWorkouts if not already completed today
        newTotalWorkouts += 1;

        if (lastDate) {
          const yesterday = new Date(today);
          yesterday.setDate(today.getDate() - 1);
          const yesterdayDateString = yesterday.toLocaleDateString('en-US');

          if (lastDate.toLocaleDateString('en-US') === yesterdayDateString) {
            newStreak += 1;
          } else if (lastDate.toLocaleDateString('en-US') !== todayDateString) {
            // If last completed date is not yesterday and not today, reset streak
            newStreak = 1;
          }
        } else {
          // First workout completed, start streak
          newStreak = 1;
        }
      }


      return {
        ...prev,
        totalWorkouts: newTotalWorkouts,
        totalTime: prev.totalTime + workoutTimer,
        currentStreak: newStreak,
        lastCompletedDate: today.toISOString(), // Store as ISO string for easy parsing
        completedToday: true // Mark as completed today
      };
    });
    setIsTimerActive(false);
    setWorkoutCompletedToday(true); // Set workout completed flag
  };

  // Reset timer
  const resetTimer = () => {
    setWorkoutTimer(0);
    setIsTimerActive(false);
  };

  const currentWorkout = workoutData[currentDay];
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  if (!currentWorkout) {
    return <div className="app">Invalid day selected</div>;
  }

  const totalSets = currentWorkout.exercises.reduce((sum, exercise) => sum + exercise.sets, 0);
  const completedSetsCount = currentWorkout.exercises.reduce((sum, exercise, exerciseIndex) => {
    const key = `${currentDay}-${exerciseIndex}`;
    return sum + (completedExercises[key] ? completedExercises[key].filter(Boolean).length : 0);
  }, 0);

  const progressPercentage = totalSets > 0 ? (completedSetsCount / totalSets) * 100 : 0;

  return (
    <div className="app-container"> {/* New container for main content + sidebar */}
      <TargetCursor 
        spinDuration={2}
        hideDefaultCursor={true}
      />
      <div className="app">
        {/* Header */}
        <header className="header cursor-target">
          <div className="header-content">
            <div className="logo">
              <Dumbbell className="logo-icon" />
              <span className="logo-text">FitTrack</span>
            </div>
            <div className="user-profile cursor-target">
              <User className="user-icon" />
            </div>
          </div>
        </header>

        {/* Stats Cards */}
        <div className="stats-grid">
          
          <div className="stat-card cursor-target">
            <Target className="stat-icon" />
            <div className="stat-content">
              <div className="stat-value">{Math.round(progressPercentage)}%</div>
              <div className="stat-label"> Daily Progress</div>
            </div>
          </div>
          <div className="stat-card cursor-target">
            <Trophy className="stat-icon" />
            <div className="stat-content">
              <div className="stat-value">{stats.totalWorkouts}</div>
              <div className="stat-label">Workouts Sessions</div>
            </div>
          </div>
          
          <div className="stat-card cursor-target">
            <Clock className="stat-icon" />
            <div className="stat-content">
              <div className="stat-value">{Math.floor(stats.totalTime / 60)}m</div>
              <div className="stat-label">Total Time Spent</div>
            </div>
          </div>
          <div className="stat-card cursor-target">
            <Trophy className="stat-icon" />
            <div className="stat-content">
              <div className="stat-value">{stats.currentStreak}</div>
              <div className="stat-label">Day Streak</div>
            </div>
          </div>
        </div>

        {/* Day Selector */}
        <div className="day-selector">
          {days.map(day => (
            <button
              key={day}
              className={`day-button cursor-target ${currentDay === day ? 'active' : ''}`}
              onClick={() => setCurrentDay(day)}
              disabled={currentDay !== day}
            >
              {day.slice(0, 3)}
            </button>
          ))}
        </div>

        {workoutCompletedToday ? (
          <div className="completion-message">
            <Trophy className="completion-icon" />
            <h1>Workout Completed!</h1>
            <p>Great job! You've crushed today's workout.</p>
            <p>Your current streak: {stats.currentStreak} days!</p>
          </div>
        ) : (
          <>
            {/* Workout Header */}
            <div className="workout-header cursor-target">
              <div className="workout-title">
                <h1>{currentWorkout.title}</h1>
                <div className="workout-meta">
                  <span className={`intensity-badge ${currentWorkout.intensity.toLowerCase().replace(' ', '-')}`}>
                    {currentWorkout.intensity} Intensity
                  </span>
                </div>
              </div>
              <div className="workout-focus">
                <Target className="focus-icon" />
                <span>Focus: {currentWorkout.focus}</span>
              </div>
            </div>

            {/* Timer */}
            <div className="timer-section cursor-target">
              <div className="timer-display">
                <Clock className="timer-icon" />
                <span className="timer-text">{formatTime(workoutTimer)}</span>
              </div>
              <div className="timer-controls">
                <button 
                  className="timer-btn start cursor-target"
                  onClick={() => setIsTimerActive(!isTimerActive)}
                >
                  {isTimerActive ? <Pause size={16} /> : <Play size={16} />}
                  {isTimerActive ? 'Pause' : 'Start'}
                </button>
                <button 
                  className="timer-btn reset cursor-target"
                  onClick={resetTimer}
                >
                  <RotateCcw size={16} />
                  Reset
                </button>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="progress-section cursor-target">
              <div className="progress-header">
                <span>Progress: {completedSetsCount}/{totalSets} sets</span>
                <span>{Math.round(progressPercentage)}%</span>
              </div>
              <div className="progress-bar">
                <div 
                  className="progress-fill"
                  style={{ width: `${progressPercentage}%` }}
                ></div>
              </div>
            </div>

            {/* Exercises */}
            <div className="exercises-section">
              <h2>Exercises</h2>
              <div className="exercises-list">
                {currentWorkout.exercises.map((exercise, exerciseIndex) => {
                  if (completedExercises[`${currentDay}-${exerciseIndex}`]?.every(Boolean)) {
                    return null;
                  }
                  return (
                    <div
                      key={exerciseIndex}
                      className={`exercise-card cursor-target`}
                      // Removed onClick from parent div to prevent accidental full exercise completion
                    >
                      <div className="exercise-header">
                        <div className="exercise-info">
                          <h3 className="exercise-name">{exercise.name}</h3>
                          <div className="exercise-meta">
                            <span className="exercise-sets">{exercise.sets} sets</span>
                            <span className="exercise-reps">
                              {customReps[`${currentDay}-${exerciseIndex}`] || exercise.reps} reps
                              <div className="rep-adjust-controls">
                                <button className="cursor-target" onClick={(e) => { e.stopPropagation(); handleRepAdjustment(exerciseIndex, -1); }}>-</button>
                                <button className="cursor-target" onClick={(e) => { e.stopPropagation(); handleRepAdjustment(exerciseIndex, 1); }}>+</button>
                              </div>
                            </span>
                          </div>
                        </div>
                        {exercise.videoLink && (
                          <button
                            className="video-play-btn cursor-target"
                            onClick={(e) => {
                              e.stopPropagation();
                              console.log("Video button clicked:", exercise.videoLink);
                              setSelectedVideo(exercise.videoLink);
                            }}
                          >
                            <Play size={16} />
                          </button>
                        )}
                      </div>
                      <div className="exercise-targets">
                        <Target className="target-icon" />
                        <span>{exercise.targets}</span>
                      </div>
                      <div className="exercise-description">
                        {exercise.description}
                      </div>
                      <div className="set-completion-bars">
                        {Array.from({ length: exercise.sets }).map((_, setIndex) => (
                          <button
                            key={setIndex}
                            className={`set-bar cursor-target ${completedExercises[`${currentDay}-${exerciseIndex}`]?.[setIndex] ? 'completed' : ''}`}
                            // Prevent event bubbling to the parent exercise-card click
                            onClick={(e) => { e.stopPropagation(); toggleSetCompletion(exerciseIndex, setIndex); }}
                          >
                            {completedExercises[`${currentDay}-${exerciseIndex}`]?.[setIndex] ? <CheckCircle size={16} /> : <Circle size={16} />}
                          </button>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Complete Workout Button */}
            {completedSetsCount === totalSets && totalSets > 0 && (
              <button className="complete-workout-btn cursor-target" onClick={completeWorkout}>
                <Trophy className="complete-icon" />
                Complete Workout
              </button>
            )}
          </>
        )}
      </div>
      {/* Right Sidebar for Video */}
      <div className={`right-sidebar ${selectedVideo ? 'active' : ''}`}>
        {selectedVideo && (
          <>
            <button className="sidebar-close-btn cursor-target" onClick={() => setSelectedVideo(null)}>
              <X size={24} />
            </button>
            <iframe
              width="100%"
              height="200"
              src={getEmbedUrl(selectedVideo)}
              title="Exercise Video"
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            ></iframe>
          </>
        )}
        {!selectedVideo && (
          <div className="sidebar-placeholder">
            <Play size={48} />
            <p>Select an exercise to watch its video</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default App;
