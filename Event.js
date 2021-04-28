import { getDayIndex, generateId, dateString } from "./helper.js";

export class Event {
    constructor(data) {
        this.id = data.id || generateId();
        this.title = data.title;
        this.start = data.start;
        this.end = data.end;
        this.date = data.date;
        this.prevDate = this.date;
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

    save(calendar) {
        if (this.prevDate && this.date != this.prevDate) {
            delete calendar.events[this.prevDate][this.id];
            if (Object.values(calendar.events[this.prevDate]).length == 0) {
                delete calendar.events[this.prevDate];
            }
        }
        if (!calendar.events[this.date]) {
            calendar.events[this.date] = {};
        }
        calendar.events[this.date][this.id] = this;
        calendar.saveEventsToLocalStorage();
    }

    show(calendar) {
        if (
            this.date < dateString(calendar.weekStart) ||
            this.date > dateString(calendar.weekEnd)
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
                .click(() => this.click(calendar));
        }
        const h = calendar.slotHeight;
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
        } else if (duration < 59) {
            eventSlot.removeClass("veryShortEvent").addClass("shortEvent");
        } else {
            eventSlot.removeClass("shortEvent").removeClass("veryShortEvent");
        }
    }

    click(calendar) {
        if (calendar.mode != "view") return;
        calendar.mode = "edit";
        calendar.openModal(this);
    }

    update(calendar) {
        this.prevDate = this.date;
        this.title = $("#eventTitle").val();
        this.start = $("#eventStart").val();
        this.end = $("#eventEnd").val();
        this.date = $("#eventDate").val();
        this.description = $("#eventDescription").val();
        this.color = $(".color.active").attr("data-color");
        this.save(calendar);
        this.show(calendar);
    }

    copy(calendar) {
        if (calendar.mode != "edit") return;
        calendar.closeModal();
        calendar.mode = "create";
        const copy = new Event({
            title: "Copy of " + this.title,
            start: this.start,
            end: this.end,
            date: this.date,
            description: this.description,
            color: this.color,
        });
        calendar.openModal(copy);
    }

    delete(calendar) {
        calendar.closeModal();
        $(`#${this.id}`).remove();
        delete calendar.events[this.date][this.id];
        if (Object.values(calendar.events[this.date]).length == 0) {
            delete calendar.events[this.date];
        }
        calendar.saveEventsToLocalStorage();
    }

    isValid(calendar) {
        const newStart = $("#eventStart").val();
        const newEnd = $("#eventEnd").val();
        const newDate = $("#eventDate").val();
        if (calendar.events[newDate]) {
            const ev = Object.values(calendar.events[newDate]).find(
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
