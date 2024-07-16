<script>
export default {
  data() {
    return {
      days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
      scheduleData: [
        { person: 'Anton', task: 'coding', start: 'Mon', end: 'Wed' },
        { person: 'Ivan', task: 'math', start: 'Mon', end: 'Tue' },
        { person: 'Petr', task: 'history', start: 'Wed', end: 'Fri' }
      ],
      selecting: false,
      startCell: null,
      endCell: null,
      showPopup: false,
      newBlock: {
        person: '',
        task: '',
        start: '',
        end: ''
      },
      draggedBlock: null,
      resizingBlock: null,
      resizeStartDay: null,
    };
  },
  computed: {
    people() {
      return [...new Set(this.scheduleData.map(block => block.person))];
    }
  },
  methods: {
    startSelection(person, day) {
      this.selecting = true;
      this.startCell = { person, day };
    },
    endSelection(person, day) {
      if (this.selecting) {
        this.selecting = false;
        this.endCell = { person, day };
        this.showPopup = true;
        this.newBlock = {
          person: this.startCell.person,
          task: '',
          start: this.startCell.day,
          end: this.endCell.day
        };
      }
    },
    handleMouseMove(person, day) {
      if (this.selecting) {
        this.endCell = { person, day };
      }
    },
    getCellClass(person, day) {
      if (this.selecting && this.isWithinSelection(person, day)) {
        return 'selected';
      }
      return '';
    },
    isWithinSelection(person, day) {
      if (!this.startCell || !this.endCell) return false;
      const startIndex = this.days.indexOf(this.startCell.day);
      const endIndex = this.days.indexOf(this.endCell.day);
      const currentIndex = this.days.indexOf(day);

      return (
        person === this.startCell.person &&
        currentIndex >= Math.min(startIndex, endIndex) &&
        currentIndex <= Math.max(startIndex, endIndex) &&
        currentIndex < 5 // Ensuring weekends are not included
      );
    },
    isBlockStart(person, day) {
      return this.scheduleData.some(block => block.person === person && block.start === day);
    },
    getColspan(person, day) {
      const block = this.scheduleData.find(block => block.person === person && block.start === day);
      if (block) {
        const startIndex = this.days.indexOf(block.start);
        const endIndex = this.days.indexOf(block.end);
        return endIndex - startIndex + 1;
      }
      return 1;
    },
    getTaskForBlock(person, day) {
      const block = this.scheduleData.find(
        block =>
          block.person === person &&
          this.days.indexOf(day) >= this.days.indexOf(block.start) &&
          this.days.indexOf(day) <= this.days.indexOf(block.end)
      );
      return block ? block.task : '';
    },
    confirmBlock() {
      const existingBlockIndex = this.scheduleData.findIndex(
        block => block.person === this.newBlock.person && block.task === this.newBlock.task
      );

      if (existingBlockIndex !== -1) {
        this.scheduleData[existingBlockIndex] = { ...this.newBlock };
      } else {
        this.scheduleData.push({ ...this.newBlock });
      }
      
      this.showPopup = false;
    },
    cancelBlock() {
      this.showPopup = false;
    },
    dragStart(person, day) {
      const block = this.scheduleData.find(block => block.person === person && block.start === day);
      this.draggedBlock = block;
    },
    dropBlock(event) {
      const cell = this.getCellFromEvent(event);
      if (cell) {
        const startIndex = this.days.indexOf(this.draggedBlock.start);
        const endIndex = this.days.indexOf(this.draggedBlock.end);
        const duration = endIndex - startIndex;
        const newStartIndex = this.days.indexOf(cell.day);
        const newEndIndex = newStartIndex + duration;
        if (newEndIndex < this.days.length) {
          this.draggedBlock.person = cell.person;
          this.draggedBlock.start = cell.day;
          this.draggedBlock.end = this.days[newEndIndex];
          this.draggedBlock = null;
        }
      }
    },
    getCellFromEvent(event) {
      const cell = event.target.closest('td');
      if (cell) {
        const rowIndex = cell.parentElement.rowIndex - 1;
        const colIndex = cell.cellIndex - 1;
        const person = this.people[rowIndex];
        const day = this.days[colIndex];
        return { person, day };
      }
      return null;
    },
    startResize(block, day) {
      this.resizingBlock = block;
      this.resizeStartDay = day;
      document.addEventListener('mousemove', this.resizeMouseMove);
      document.addEventListener('mouseup', this.endResize);
    },
    resizeMouseMove(event) {
      const cell = this.getCellFromEvent(event);
      if (cell) {
        const startIndex = this.days.indexOf(this.resizeStartDay);
        const endIndex = this.days.indexOf(cell.day);
        if (startIndex <= endIndex) {
          this.resizingBlock.end = this.days[endIndex];
        }
      }
    },
    endResize() {
      document.removeEventListener('mousemove', this.resizeMouseMove);
      document.removeEventListener('mouseup', this.endResize);
      this.resizingBlock = null;
      this.resizeStartDay = null;
    }
  }
};
</script>

<template>
  <div class="container">
    <table>
      <thead>
        <tr>
          <th>Person</th>
          <th v-for="day in days" :key="day">{{ day }}</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="person in people" :key="person">
          <td>{{ person }}</td>
          <td
            v-for="day in days"
            :key="day"
            :class="getCellClass(person, day)"
            @mousedown="startSelection(person, day)"
            @mouseup="endSelection(person, day)"
            @mousemove="handleMouseMove(person, day)"
          >
            <div
              v-if="isBlockStart(person, day)"
              :style="{ 'grid-column': 'span ' + getColspan(person, day) }"
              class="schedule-block"
              draggable="true"
              @dragstart="dragStart(person, day)"
              @dragover.prevent
              @drop="dropBlock"
            >
              {{ getTaskForBlock(person, day) }}
              <div class="resize-handle" @mousedown.stop="startResize(scheduleData.find(block => block.person === person && block.start === day), day)"></div>
            </div>
          </td>
        </tr>
      </tbody>
    </table>

    <div v-if="showPopup" class="popup">
      <div class="popup-content">
        <h3>Confirm Schedule Block</h3>
        <label>
          Person:
          <input type="text" v-model="newBlock.person" placeholder="Enter person name" />
        </label>
        <label>
          Task Name:
          <input type="text" v-model="newBlock.task" placeholder="Enter task name" />
        </label>
        <label>
          Start Day:
          <select v-model="newBlock.start">
            <option v-for="day in days" :key="day" :value="day">{{ day }}</option>
          </select>
        </label>
        <label>
          End Day:
          <select v-model="newBlock.end">
            <option v-for="day in days" :key="day" :value="day">{{ day }}</option>
          </select>
        </label>
        <button @click="confirmBlock">Confirm</button>
        <button @click="cancelBlock">Cancel</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.container {
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  margin: 0 auto;
}
table {
  width: 100%;
  max-width: 1200px;
  border-collapse: collapse;
  margin: 20px 0;
}

thead {
  background-color: #4CAF50;
}

th, td {
  border: 1px solid #ddd;
  padding: 8px;
  text-align: center;
}

th {
  padding-top: 12px;
  padding-bottom: 12px;
  background-color: #4CAF50;
  color: white;
}

.schedule-block {
  background-color: #4CAF50;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  border-radius: 4px;
  position: relative;
}

.selected {
  background-color: #d3d3d3;
}

.resize-handle {
  width: 10px;
  height: 100%;
  background-color: #000;
  position: absolute;
  right: 0;
  top: 0;
  cursor: ew-resize;
}

.popup {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background-color: white;
  border: 1px solid #ddd;
  padding: 20px;
  z-index: 1000;
}

.popup-content {
  display: flex;
  flex-direction: column;
}

.popup-content label {
  margin-bottom: 10px;
}

.popup-content button {
  margin-top: 10px;
}
</style>
