<template>
  <div>
    <h1>Schedule</h1>
    <table>
      <thead>
        <tr>
          <th>Person</th>
          <th v-for="day in days" :key="day" class="fixed-cell">{{ day }}</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="entry in scheduleData" :key="entry._id" :data-person="entry._id">
          <td class="highlight"><b>{{ entry.person }}</b></td>
          <template v-for="day in days" :key="day">
            <td v-if="isTaskStart(entry, day)" 
                :colspan="getColspan(entry)" 
                class="droppable task-block fixed-cell"
                :draggable="!resizingTask"
                @dragstart="dragStart($event, entry, day)"
                @dragover="dragOver($event)"
                @drop="drop($event)"
                :class="{ 'weekend': isWeekend(day) }">
              {{ entry.task }}
              <span class="resize-handle start" @mousedown="resizeStart($event, entry, 'start')"></span>
              <span class="resize-handle end" @mousedown="resizeStart($event, entry, 'end')"></span>
            </td>
            <td v-else-if="isTaskInSpan(entry, day)" class="fixed-cell" v-show="false"></td>
            <td v-else class="droppable fixed-cell"
                :class="{ 'weekend': isWeekend(day) }"
                @mousedown="mouseDown($event, day, entry.person)"
                @mouseup="mouseUp($event, day, entry.person)"
                @mousemove="mouseMove($event, day)"
                @dragover="dragOver($event)"
                @drop="drop($event)"></td>
          </template>
        </tr>
        <tr>
          <td class="highlight"><b>New Person</b></td>
          <template v-for="day in days" :key="day">
            <td class="droppable fixed-cell"
                :class="{ 'weekend': isWeekend(day) }"
                @mousedown="mouseDown($event, day, 'New Person')"
                @mouseup="mouseUp($event, day, 'New Person')"
                @mousemove="mouseMove($event, day)"
                @dragover="dragOver($event)"
                @drop="drop($event)"></td>
          </template>
        </tr>
      </tbody>
    </table>

    <!-- Modal for new block creation -->
    <div v-if="showModal" class="modal">
      <div class="modal-content">
        <span class="close" @click="closeModal">&times;</span>
        <h2>Create or Update Task</h2>
        <form @submit.prevent="confirmNewBlock">
          <div class="form-group">
            <label for="person">Person:</label>
            <input type="text" v-model="newBlock.person" required>
          </div>

          <div class="form-group">
            <label for="task">Task Name:</label>
            <input type="text" v-model="newBlock.task" required>
          </div>

          <div class="form-group">
            <label for="start">Start Date:</label>
            <select v-model="newBlock.start" @change="validateDates" required>
              <option v-for="day in weekdays" :key="day" :value="day">{{ day }}</option>
            </select>
          </div>

          <div class="form-group">
            <label for="end">End Date:</label>
            <select v-model="newBlock.end" @change="validateDates" required>
              <option v-for="day in weekdays" :key="day" :value="day">{{ day }}</option>
            </select>
          </div>

          <p v-if="dateError" class="error">{{ dateError }}</p>

          <div class="form-actions">
            <button type="submit" :disabled="!!dateError">Confirm</button>
            <button type="button" @click="closeModal">Cancel</button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script>
import axios from 'axios';

export default {
  data() {
    return {
      days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
      weekdays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
      scheduleData: [],
      draggingTask: null,
      resizingTask: null,
      resizingDirection: null,
      initialMouseX: 0,
      initialStartIndex: null,
      initialEndIndex: null,
      finalStartIndex: null,
      finalEndIndex: null,
      dragStartIndex: null,
      dragEndIndex: null,
      dragStartPerson: null,
      selecting: false,
      selectionStart: null,
      selectionEnd: null,
      showModal: false,
      newBlock: {
        person: '',
        task: '',
        start: '',
        end: ''
      },
      dateError: ''
    };
  },
  methods: {
    async fetchSchedule() {
      try {
        const response = await axios.get('http://localhost:3000/api/schedule');
        this.scheduleData = response.data;
      } catch (error) {
        console.error('Error fetching schedule:', error);
      }
    },
    async updateRecord(updatedEntry) {
      try {
        await axios.put(`http://localhost:3000/api/schedule/${updatedEntry._id}`, updatedEntry);
        console.log('Schedule updated:', updatedEntry);
      } catch (error) {
        console.error('Error updating schedule:', error);
      }
    },
    async createNewBlock(newEntry) {
      try {
        const response = await axios.post('http://localhost:3000/api/schedule', newEntry);
        this.scheduleData.push(response.data);
        console.log('New schedule created:', response.data);
      } catch (error) {
        console.error('Error creating new schedule:', error);
      }
    },
    getColspan(entry) {
      const startIndex = this.days.indexOf(entry.start);
      const endIndex = this.days.indexOf(entry.end);
      return endIndex - startIndex + 1;
    },
    isTaskStart(entry, day) {
      return entry.start === day;
    },
    isTaskInSpan(entry, day) {
      const startIndex = this.days.indexOf(entry.start);
      const endIndex = this.days.indexOf(entry.end);
      const currentIndex = this.days.indexOf(day);
      return currentIndex > startIndex && currentIndex <= endIndex;
    },
    dragStart(event, entry, day) {
      if (!this.resizingTask) {
        this.draggingTask = entry;
        this.initialMouseX = event.clientX;
        this.dragStartIndex = this.days.indexOf(entry.start);
        this.dragEndIndex = this.days.indexOf(entry.end);
        this.dragStartPerson = entry.person;
      }
    },
    dragOver(event) {
      event.preventDefault();
    },
    async drop(event) {
      if (this.draggingTask) {
        const targetRow = event.target.closest('tr');
        const targetPersonId = targetRow ? targetRow.getAttribute('data-person') : null;

        if (targetPersonId && targetPersonId !== this.draggingTask._id) {
          const targetTaskIndex = this.scheduleData.findIndex(entry => entry._id === targetPersonId);

          if (targetTaskIndex !== -1) {
            this.scheduleData[targetTaskIndex].task = this.draggingTask.task;
            this.scheduleData[targetTaskIndex].start = this.draggingTask.start;
            this.scheduleData[targetTaskIndex].end = this.draggingTask.end;
            await this.updateRecord(this.scheduleData[targetTaskIndex]);
          }

          const sourceTaskIndex = this.scheduleData.findIndex(entry => entry._id === this.draggingTask._id);

          if (sourceTaskIndex !== -1) {
            this.scheduleData[sourceTaskIndex].task = '';
            this.scheduleData[sourceTaskIndex].start = '';
            this.scheduleData[sourceTaskIndex].end = '';
            await this.updateRecord(this.scheduleData[sourceTaskIndex]);
          }
        }

        this.draggingTask = null;
      }
    },
    resizeStart(event, entry, direction) {
      this.resizingTask = entry;
      this.resizingDirection = direction;
      this.initialMouseX = event.clientX;
      this.initialStartIndex = this.days.indexOf(entry.start);
      this.initialEndIndex = this.days.indexOf(entry.end);
      this.finalStartIndex = this.initialStartIndex;
      this.finalEndIndex = this.initialEndIndex;
      document.addEventListener('mousemove', this.resizeMove);
      document.addEventListener('mouseup', this.resizeEnd);
    },
    resizeMove(event) {
      if (this.resizingTask && this.resizingDirection) {
        const taskStartIndex = this.initialStartIndex;
        const taskEndIndex = this.initialEndIndex;
        let newStartIndex = taskStartIndex;
        let newEndIndex = taskEndIndex;
        const dayWidth = document.querySelector('table').getBoundingClientRect().width / this.days.length;
        const moveAmount = Math.round((event.clientX - this.initialMouseX) / dayWidth);

        if (this.resizingDirection === 'start') {
          newStartIndex = taskStartIndex + moveAmount;
          if (newStartIndex <= taskEndIndex && newStartIndex >= 0 && !this.isWeekend(this.days[newStartIndex])) {
            this.finalStartIndex = newStartIndex;
            this.resizingTask.start = this.days[newStartIndex];
          }
        } else if (this.resizingDirection === 'end') {
          newEndIndex = taskEndIndex + moveAmount;
          if (newEndIndex >= taskStartIndex && newEndIndex < this.days.length && !this.isWeekend(this.days[newEndIndex])) {
            this.finalEndIndex = newEndIndex;
            this.resizingTask.end = this.days[newEndIndex];
          }
        }

        if (newEndIndex - newStartIndex < 1) {
          if (this.resizingDirection === 'start') {
            this.finalStartIndex = taskEndIndex;
            this.resizingTask.start = this.days[taskEndIndex];
          } else if (this.resizingDirection === 'end') {
            this.finalEndIndex = taskStartIndex;
            this.resizingTask.end = this.days[taskStartIndex];
          }
        }
      }
    },
    resizeEnd() {
      document.removeEventListener('mousemove', this.resizeMove);
      document.removeEventListener('mouseup', this.resizeEnd);
      if (this.resizingTask) {
        if (this.initialStartIndex !== this.finalStartIndex || this.initialEndIndex !== this.finalEndIndex) {
          this.updateRecord(this.resizingTask);
        }
      }
      this.resizingTask = null;
      this.resizingDirection = null;
    },
    isWeekend(day) {
      return day === 'Saturday' || day === 'Sunday';
    },
    mouseDown(event, day, person) {
      if (!this.resizingTask) {
        this.selecting = true;
        this.selectionStart = this.days.indexOf(day);
        this.newBlock.person = person;
      }
    },
    mouseMove(event, day) {
      if (this.selecting) {
        this.selectionEnd = this.days.indexOf(day);
      }
    },
    mouseUp(event, day, person) {
      if (!this.resizingTask) {
        this.selecting = false;
        if (this.selectionStart !== null && this.selectionEnd !== null) {
          const start = Math.min(this.selectionStart, this.selectionEnd);
          const end = Math.max(this.selectionStart, this.selectionEnd);
          this.newBlock.start = this.days[start];
          this.newBlock.end = this.days[end];
          this.showModal = true;
        } else {
          this.newBlock.start = day;
          this.newBlock.end = day;
          this.newBlock.person = person;
          this.showModal = true;
        }
        this.selectionStart = null;
        this.selectionEnd = null;
      }
    },
    closeModal() {
      this.showModal = false;
      this.dateError = '';
      this.newBlock = {
        person: '',
        task: '',
        start: '',
        end: ''
      };
    },
    validateDates() {
      const startIndex = this.weekdays.indexOf(this.newBlock.start);
      const endIndex = this.weekdays.indexOf(this.newBlock.end);
      if (startIndex > endIndex) {
        this.dateError = 'Start date cannot be after end date.';
      } else {
        this.dateError = '';
      }
    },
    async confirmNewBlock() {
      const startIndex = this.weekdays.indexOf(this.newBlock.start);
      const endIndex = this.weekdays.indexOf(this.newBlock.end);
      
      if (startIndex <= endIndex) {
        const existingPersonIndex = this.scheduleData.findIndex(entry => entry.person === this.newBlock.person);

        if (existingPersonIndex !== -1) {
          this.scheduleData[existingPersonIndex].task = this.newBlock.task;
          this.scheduleData[existingPersonIndex].start = this.newBlock.start;
          this.scheduleData[existingPersonIndex].end = this.newBlock.end;
          await this.updateRecord(this.scheduleData[existingPersonIndex]);
        } else {
          const newTask = {
            person: this.newBlock.person,
            task: this.newBlock.task,
            start: this.newBlock.start,
            end: this.newBlock.end
          };
          await this.createNewBlock(newTask);
        }

        this.closeModal();
      } else {
        this.dateError = 'Start date cannot be after end date.';
      }
    }
  },
  mounted() {
    this.fetchSchedule();
  }
};
</script>

<style>
body {
  font-family: Arial, sans-serif;
  background-color: #f8f9fa;
  margin: 0;
  padding: 0;
}

h1 {
  text-align: center;
  color: #343a40;
}

table {
  border-collapse: collapse;
  margin: 20px auto;
  background-color: #fff;
  border: 2px solid #dee2e6;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  table-layout: fixed;
}

th,
td {
  border: 1px solid #dee2e6;
  padding: 10px;
  text-align: center;
}

th {
  background-color: #f2f2f2;
  color: #343a40;
}

.highlight {
  background-color: #f8f9fa;
}

.special {
  background-color: #f0f0f0;
}

.fixed-cell {
  width: 100px; /* Set a fixed width for cells */
}

.draggable {
  cursor: move;
}

.weekend {
  background-color: #c9cccc; /* Серый цвет для ячеек выходных */
  pointer-events: none;
}

.task-block {
  background-color: #0f3e8a;
  color: white;
  position: relative;
  user-select: none;
  border-radius: 13px;
}

.resize-handle {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  width: 10px;
  height: 100%;
  cursor: ew-resize;
}

.resize-handle.start {
  left: -5px;
}

.resize-handle.end {
  right: -5px;
}

.modal {
  display: flex;
  justify-content: center;
  align-items: center;
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
}

.modal-content {
  background-color: #fff;
  padding: 20px;
  border-radius: 10px;
  width: 400px;
  max-width: 90%;
  text-align: center;
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
  position: relative;
}

.close {
  position: absolute;
  top: 10px;
  right: 10px;
  font-size: 24px;
  cursor: pointer;
}

.form-group {
  margin-bottom: 15px;
  text-align: left;
}

.form-group label {
  display: block;
  margin-bottom: 5px;
}

.form-group input,
.form-group select {
  width: calc(100% - 10px);
  padding: 10px;
  font-size: 16px;
  border: 1px solid #ccc;
  border-radius: 5px;
}

.form-actions {
  display: flex;
  justify-content: space-between;
}

button {
  margin: 10px;
  padding: 10px 20px;
  font-size: 16px;
  cursor: pointer;
  border: none;
  border-radius: 5px;
}

button[type="submit"] {
  background-color: #28a745;
  color: white;
}

button[type="button"] {
  background-color: #dc3545;
  color: white;
}

.error {
  color: red;
  margin-top: -10px;
  margin-bottom: 15px;
}
</style>
