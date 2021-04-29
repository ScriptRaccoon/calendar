import { dateString, getDayIndex, addDays } from "./helper.js";
import { Event, MODE } from "./Event.js";

export class Calendar {
    constructor() {
        this.mode = MODE.VIEW;
        this.events = {};
        this.weekOffset = 0;
        this.readyToTrash = false;
        this.slotHeight = 30;
        this.weekStart = null;
        this.weekEnd = null;
        this.eventsLoaded = false;
    }

    setup() {
        this.setupTimes();
        this.setupDays();
        this.calculateCurrentWeek();
        this.showWeek();
        this.loadEvents();
        this.setupControls();
    }

    setupControls() {
        $("#nextWeekBtn").click(() => this.changeWeek(1));
        $("#prevWeekBtn").click(() => this.changeWeek(-1));
        $("#addButton").click(() => this.addNewEvent());
        $("#trashButton").click(() => this.trash());
        $("#cancelButton").click(() => this.closeModal());
        $(".color").click(this.changeColor);
    }

    setupTimes() {
        const header = $("<div></div>").addClass("columnHeader");
        const slots = $("<div></div>").addClass("slots");
        for (let hour = 0; hour < 24; hour++) {
            $("<div></div>")
                .attr("data-hour", hour)
                .addClass("time")
                .text(`${hour}:00 - ${hour + 1}:00`)
                .appendTo(slots);
        }
        $(".dayTime").append(header).append(slots);
    }

    setupDays() {
        const cal = this;
        $(".day").each(function () {
            const dayIndex = parseInt($(this).attr("data-dayIndex"));
            const name = $(this).attr("data-name");
            const header = $("<div></div>").addClass("columnHeader").text(name);
            const slots = $("<div></div>").addClass("slots");
            $("<div></div>").addClass("dayDisplay").appendTo(header);
            for (let hour = 0; hour < 24; hour++) {
                $("<div></div>")
                    .attr("data-hour", hour)
                    .appendTo(slots)
                    .addClass("slot")
                    .click(() => cal.clickSlot(hour, dayIndex))
                    .hover(
                        () => cal.hoverOver(hour),
                        () => cal.hoverOut()
                    );
            }
            $(this).append(header).append(slots);
        });
    }

    calculateCurrentWeek() {
        const now = new Date();
        this.weekStart = addDays(now, -getDayIndex(now));
        this.weekEnd = addDays(this.weekStart, 6);
    }

    changeWeek(number) {
        this.weekOffset += number;
        this.weekStart = addDays(this.weekStart, 7 * number);
        this.weekEnd = addDays(this.weekEnd, 7 * number);
        this.showWeek();
        this.loadEvents();
    }

    showWeek() {
        const options = {
            month: "2-digit",
            day: "2-digit",
            year: "numeric",
        };
        $("#weekStartDisplay").text(
            this.weekStart.toLocaleDateString(undefined, options)
        );
        $("#weekEndDisplay").text(this.weekEnd.toLocaleDateString(undefined, options));

        for (let dayIndex = 0; dayIndex < 7; dayIndex++) {
            const date = addDays(this.weekStart, dayIndex);
            const display = date.toLocaleDateString(undefined, {
                month: "2-digit",
                day: "2-digit",
            });
            $(`.day[data-dayIndex=${dayIndex}] .dayDisplay`).text(display);
        }
        if (this.weekOffset == 0) {
            this.showCurrentDay();
        } else {
            this.hideCurrentDay();
        }
    }

    showCurrentDay() {
        const now = new Date();
        const dayIndex = getDayIndex(now);
        $(`.day[data-dayIndex=${dayIndex}]`).addClass("currentDay");
    }

    hideCurrentDay() {
        $(".day").removeClass("currentDay");
    }

    hoverOver(hour) {
        $(`.time[data-hour=${hour}]`).addClass("currentTime");
    }

    hoverOut() {
        $(".time").removeClass("currentTime");
    }

    clickSlot(hour, dayIndex) {
        if (this.mode != MODE.VIEW) return;
        this.mode = MODE.CREATE;
        const start = hour.toString().padStart(2, "0") + ":00";
        const end =
            hour < 23
                ? (hour + 1).toString().padStart(2, "0") + ":00"
                : hour.toString().padStart(2, "0") + ":59";

        const date = dateString(addDays(this.weekStart, dayIndex));
        const event = new Event({
            start,
            end,
            date,
            title: "",
            description: "",
            color: "red",
        });
        this.openModal(event);
    }

    changeColor() {
        $(".color").removeClass("active");
        $(this).addClass("active");
    }

    openModal(event) {
        $("#modalTitle").text(
            this.mode == MODE.UPDATE ? "Update your event" : "Create a new event"
        );
        $("#eventTitle").val(event.title);
        $("#eventDate").val(event.date);
        $("#eventStart").val(event.start);
        $("#eventEnd").val(event.end);
        $("#eventDescription").val(event.description);
        $(".color").removeClass("active");
        $(`.color[data-color=${event.color}]`).addClass("active");
        if (this.mode == MODE.UPDATE) {
            $("#submitButton").val("Update");
            $("#deleteButton")
                .show()
                .off("click")
                .click(() => event.deleteIn(this));
            $("#copyButton")
                .show()
                .off("click")
                .click(() => event.copyIn(this));
        } else if (this.mode == MODE.CREATE) {
            $("#submitButton").val("Create");
            $("#deleteButton, #copyButton").hide();
        }
        $("#eventModal").fadeIn(200);
        $("#eventTitle").focus();
        $("#calendar").addClass("opaque");
        $("#eventModal")
            .off("submit")
            .submit((e) => {
                e.preventDefault();
                this.submitModal(event);
            });
    }

    submitModal(event) {
        if (event.isValidIn(this)) {
            event.updateIn(this);
            this.closeModal();
        }
    }

    closeModal() {
        $("#eventModal").fadeOut(200);
        $("#errors").text("");
        $("#calendar").removeClass("opaque");
        this.mode = MODE.VIEW;
    }

    addNewEvent() {
        if (this.mode != MODE.VIEW) return;
        this.mode = MODE.CREATE;
        const event = new Event({
            start: "12:00",
            end: "13:00",
            date: dateString(this.weekStart),
            title: "",
            description: "",
            color: "red",
        });
        this.openModal(event);
    }

    saveEvents() {
        localStorage.setItem("events", JSON.stringify(this.events));
    }

    loadEvents() {
        $(".event").remove();
        if (!this.eventsLoaded) {
            this.events = JSON.parse(localStorage.getItem("events"));
            if (this.events) {
                for (const date of Object.keys(this.events)) {
                    for (const id of Object.keys(this.events[date])) {
                        const event = new Event(this.events[date][id]);
                        this.events[date][id] = event;
                    }
                }
            }
            this.eventsLoaded = true;
        }
        if (this.events) {
            for (let dayIndex = 0; dayIndex < 7; dayIndex++) {
                const date = dateString(addDays(this.weekStart, dayIndex));
                if (this.events[date]) {
                    for (const event of Object.values(this.events[date])) {
                        event.showIn(this);
                    }
                }
            }
        } else {
            this.events = {};
        }
    }

    trash() {
        if (this.mode != MODE.VIEW) return;
        if (this.readyToTrash) {
            this.readyToTrash = false;
            this.events = {};
            this.saveEvents();
            $(".event").remove();
        } else {
            this.readyToTrash = true;
            window.alert(
                "This will delete all the events in your calendar. " +
                    "This cannot be undone. If you are sure, click " +
                    "the trash can again in the next minute."
            );
            setTimeout(() => {
                this.readyToTrash = false;
            }, 60 * 1000);
        }
    }
}
