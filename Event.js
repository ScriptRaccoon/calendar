import { getDayIndex, generateId, dateString } from "./helper.js";

export class Event {
    constructor(data) {
        this.calendar = data.calendar;
        this.id = generateId();
        this.title = data.title;
        this.start = data.start;
        this.end = data.end;
        this.date = data.date;
        this.description = data.description;
        this.color = data.color;
    }

    get dayIndex() {
        return getDayIndex(new Date(this.date));
    }

    get duration() {
        return (
            (new Date(`${this.date}T${this.end}`).getTime() -
                new Date(`${this.date}T${this.start}`).getTime()) /
            (1000 * 60)
        );
    }

    get startHour() {
        return parseInt(this.start.substring(0, 2));
    }

    get startMinutes() {
        return parseInt(this.start.substring(3, 5));
    }

    get endHour() {
        return parseInt(this.end.substring(0, 2));
    }

    get endMinutes() {
        return parseInt(this.end.substring(3, 5));
    }

    save() {
        const events = this.calendar.events;
        if (this.prevDate && this.date != this.prevDate) {
            delete events[this.prevDate][this.id];
            if (Object.values(events[this.prevDate]).length == 0) {
                delete events[this.prevDate];
            }
        }
        if (!events[this.date]) {
            events[this.date] = {};
        }
        events[this.date][this.id] = this;
        // this.saveEventsToLocalStorage(); // todo
        // wollen/können wir ein Event so im localStorage speichern?
    }

    show() {
        if (
            this.date < dateString(this.calendar.weekStart) ||
            this.date > dateString(this.calendar.weekEnd)
        ) {
            $(`#${this.id}`).remove();
            return;
        }
        let eventSlot;
        if ($(`#${this.id}`).length) {
            eventSlot = $(`#${this.id}`);
        } else {
            eventSlot = $("<div></div>")
                .addClass("event")
                .attr("id", this.id)
                .attr("data-date", this.date)
                .click(() => this.click());
        }
        const h = this.calendar.slotHeight;
        eventSlot
            .text(this.title)
            .css("top", this.startHour * h + (this.startMinutes / 60) * h + 2 + "px")
            .css(
                "bottom",
                24 * h - (this.endHour * h + (this.endMinutes / 60) * h) + 1 + "px"
            )
            .attr("data-date", this.date)
            .css("backgroundColor", `var(--color-${this.color})`)
            .appendTo(`.slots[data-dayIndex=${this.dayIndex}]`);

        const duration = this.duration;
        if (duration < 45) {
            eventSlot.removeClass("shortEvent").addClass("veryShortEvent");
        } else if (duration < 60) {
            eventSlot.removeClass("veryShortEvent").addClass("shortEvent");
        } else {
            eventSlot.removeClass("shortEvent").removeClass("veryShortEvent");
        }
    }

    click() {
        if (this.calendar.mode != "view") return;
        this.calendar.mode = "edit";
        this.calendar.openModal(this);
    }

    update() {
        this.title = $("#eventTitle").val();
        this.start = $("#eventStart").val();
        this.end = $("#eventEnd").val();
        this.date = $("#eventDate").val();
        this.description = $("#eventDescription").val();
        this.color = $(".color.active").attr("data-color");
        this.show();
        this.save();
    }

    copy() {
        if (this.calendar.mode != "edit") return;
        this.calendar.closeModal();
        this.calendar.mode = "create";
        this.calendar.openModal({
            calendar: this.calendar,
            title: "Copy of " + this.title,
            start: this.start,
            end: this.end,
            date: this.date,
            description: this.description,
            color: this.color,
        });
    }

    delete() {
        this.calendar.closeModal();
        $(`#${this.id}`).remove();
        delete this.calendar.events[this.date][this.id];
        if (Object.values(this.calendar.events[this.date]).length == 0) {
            delete this.calendar.events[this.date];
        }
        // this.saveEventsToLocalStorage();
    }

    isValid() {
        const newStart = $("#eventStart").val();
        const newEnd = $("#eventEnd").val();
        const newDate = $("#eventDate").val();
        if (this.calendar.events[newDate]) {
            const ev = Object.values(this.calendar.events[newDate]).find(
                (ev) => ev.id != this.id && ev.end > newStart && ev.start < newEnd
            );
            if (ev) {
                $("#errors").text(
                    `This collides with the event '${ev.title}'
                (${ev.start} - ${ev.end}).`
                );
                return false;
            }
        }
        const duration =
            (new Date(`${newDate}T${newEnd}`).getTime() -
                new Date(`${newDate}T${newStart}`).getTime()) /
            (1000 * 60);
        if (duration < 0) {
            $("#errors").text("The start cannot be after the end.");
            return false;
        } else if (duration < 30) {
            $("#errors").text("Events should be at least 30 minutes.");
            return false;
        }
        return true;
    }
}
