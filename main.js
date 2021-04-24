// global variables

let mode = "view";
let currentEvent = null;
let events;
let firstLoad = true;

const slotHeight = 30;

const dateOptions = { month: "2-digit", day: "2-digit", year: "numeric" };
let weekStart, weekEnd;

// setup calendar

$(() => {
    setupCalendar();
});

function setupCalendar() {
    $("#calendar > *").each(function () {
        const name = $(this).attr("data-name");
        const dayIndex = parseInt($(this).attr("data-dayIndex"));
        const isDay = $(this).hasClass("day");
        const header = $("<div></div>").addClass("columnHeader").text(name);
        const slots = $("<div></div>").addClass("slots");
        if (isDay) {
            slots.attr("data-dayIndex", dayIndex);
        }
        for (let hour = 0; hour < 24; hour++) {
            const slot = $("<div></div>").attr("data-hour", hour).appendTo(slots);
            if (isDay) {
                slot.addClass("slot")
                    .attr("data-dayIndex", dayIndex)
                    .click(clickSlot)
                    .hover(hoverOverSlot, hoverOutSlot);
            } else {
                slot.addClass("time").text(`${hour}:00 - ${hour + 1}:00`);
            }
        }
        $(this).append(header).append(slots);
    });
    getCurrentWeek();
    loadEvents();
}

// slot functions

function hoverOverSlot() {
    const hour = $(this).attr("data-hour");
    $(`.time[data-hour=${hour}]`).addClass("currentTime");
}

function hoverOutSlot() {
    $(".time").removeClass("currentTime");
}

function clickSlot() {
    if (mode != "view") return;
    const slot = $(this);
    const hour = slot.attr("data-hour");
    const start = hour.padStart(2, "0") + ":00";
    const end = ((parseInt(hour) + 1) % 24).toString().padStart(2, "0") + ":00";
    let dayIndex = parseInt(slot.attr("data-dayIndex"));
    const date = dateString(
        new Date(weekStart.getTime() + dayIndex * 24 * 60 * 60 * 1000)
    );
    currentEvent = { start, end, date, dayIndex };
    mode = "create";
    openModal();
}

// modal functions

function openModal() {
    const modalTitle = mode == "edit" ? "Update your event" : "Create a new event";
    $("#modalTitle").text(modalTitle);
    $("#eventDate").val(currentEvent.date);
    $("#eventStart").val(currentEvent.start);
    $("#eventEnd").val(currentEvent.end);
    if (mode == "edit") {
        $("#submitButton").val("Update");
        $("#deleteButton").show();
        $("#eventTitle").val(currentEvent.title);
        $("#eventDescription").val(currentEvent.description);
        $(`.color[data-color=${currentEvent.color}]`).addClass("active");
    } else if (mode == "create") {
        $("#submitButton").val("Create");
        $("#deleteButton").hide();
        $(".color").removeClass("active");
        $(".color[data-color=red]").addClass("active");
        $("#eventTitle").val("");
        $("#eventDescription").val("");
    }
    $("#eventModal").fadeIn("fast");
    $("#eventTitle").focus();
    $("#calendar").addClass("opaque");
}

function closeModal() {
    $("#eventModal").hide();
    $("#errors").text("");
    $("#calendar").removeClass("opaque");
    mode = "view";
    currentEvent = null;
}

$("#cancelButton").click(closeModal);

$("#addButton").click(() => {
    if (mode != "view") return;
    mode = "create";
    const now = new Date();
    currentEvent = {
        start: "12:00",
        end: "13:00",
        date: dateString(now),
        dayIndex: getDayIndex(now),
    };
    openModal();
});

// event functions

function loadEvents() {
    $(".event").remove();
    if (firstLoad) events = JSON.parse(localStorage.getItem("events"));
    firstLoad = false;
    if (events) {
        for (let i = 0; i < 7; i++) {
            const date = dateString(
                new Date(weekStart.getTime() + i * 24 * 60 * 60 * 1000)
            );
            if (events[date]) {
                for (const event of Object.values(events[date])) {
                    showEvent(event);
                }
            }
        }
    } else {
        events = {};
    }
}

$("#eventModal").submit((e) => {
    e.preventDefault();
    currentEvent.title = $("#eventTitle").val();
    if (currentEvent.title == "") {
        $("#errors").text("There is no title");
        return;
    }
    currentEvent.start = $("#eventStart").val();
    currentEvent.end = $("#eventEnd").val();
    if (currentEvent.start > currentEvent.end) {
        $("#errors").text("The start cannot be after the end");
        return;
    }
    currentEvent.prevDate = currentEvent.date;
    currentEvent.date = $("#eventDate").val();
    currentEvent.dayIndex = getDayIndex(new Date(currentEvent.date));
    currentEvent.description = $("#eventDescription").val();
    currentEvent.color = $(".color.active").attr("data-color");
    if (mode == "create") {
        createEvent();
    } else if (mode == "edit") {
        updateEvent();
    }
    closeModal();
});

function createEvent() {
    currentEvent.id = generateId(20);
    if (!events[currentEvent.date]) {
        events[currentEvent.date] = {};
    }
    events[currentEvent.date][currentEvent.id] = currentEvent;
    saveEvents();
    showEvent(currentEvent);
}

function clickEvent() {
    const id = $(this).attr("id");
    const date = $(this).attr("data-date");
    const event = events[date][id];
    if (!event) return;
    currentEvent = event;
    mode = "edit";
    openModal();
}

function updateEvent() {
    showEvent(currentEvent);
    if (currentEvent.date != currentEvent.prevDate) {
        delete events[currentEvent.prevDate][currentEvent.id];
        if (Object.values(events[currentEvent.prevDate]).length == 0) {
            delete events[currentEvent.prevDate];
        }
        if (!events[currentEvent.date]) {
            events[currentEvent.date] = {};
        }
        events[currentEvent.date][currentEvent.id] = currentEvent;
    }
    saveEvents();
}

function showEvent(ev) {
    if (ev.date < dateString(weekStart) || ev.date > dateString(weekEnd)) {
        $(`#${ev.id}`).remove();
        return;
    }
    const startHour = parseInt(ev.start.substring(0, 2));
    const startMinutes = parseInt(ev.start.substring(3, 5));
    const endHour = parseInt(ev.end.substring(0, 2));
    const endMinutes = parseInt(ev.end.substring(3, 5));
    let eventSlot;
    if ($(`#${ev.id}`).length) {
        eventSlot = $(`#${ev.id}`);
    } else {
        eventSlot = $("<div></div>")
            .addClass("event")
            .attr("id", ev.id)
            .attr("data-date", ev.date)
            .click(clickEvent);
    }
    eventSlot
        .text(ev.title)
        .css("top", startHour * slotHeight + (startMinutes / 60) * slotHeight + 2 + "px")
        .css(
            "bottom",
            24 * slotHeight -
                (endHour * slotHeight + (endMinutes / 60) * slotHeight) +
                1 +
                "px"
        )
        .attr("data-date", ev.date)
        .css("backgroundColor", `var(--color-${ev.color})`)
        .appendTo(`.slots[data-dayIndex=${ev.dayIndex}]`);
}

function saveEvents() {
    localStorage.setItem("events", JSON.stringify(events));
}

$("#deleteButton").click(() => {
    delete events[currentEvent.date][currentEvent.id];
    saveEvents();
    $(`#${currentEvent.id}`).remove();
    closeModal();
});

// change color

$(".color").click(function () {
    $(".color.active").removeClass("active");
    $(this).addClass("active");
    currentEvent.color = $(this).attr("data-color");
});

// week functions

$("#nextWeekBtn").click(() => {
    changeWeek(1);
});

$("#prevWeekBtn").click(() => {
    changeWeek(-1);
});

function changeWeek(number) {
    const offset = number * 1000 * 60 * 60 * 24 * 7;
    weekStart = new Date(weekStart.getTime() + offset);
    weekEnd = new Date(weekEnd.getTime() + offset);
    showWeek();
    loadEvents();
}

function getCurrentWeek() {
    const currentDate = new Date();
    const firstDay = currentDate.getDate() - currentDate.getDay() + 1;
    weekStart = new Date(currentDate.setDate(firstDay));
    weekEnd = new Date(currentDate.setDate(firstDay + 6));
    showWeek();
}

function showWeek() {
    $("#weekStartDisplay").text(weekStart.toLocaleDateString(undefined, dateOptions));
    $("#weekEndDisplay").text(weekEnd.toLocaleDateString(undefined, dateOptions));
}

// auxiliary stuff

function dateString(date) {
    return `${date.getFullYear()}-${(date.getMonth() + 1)
        .toString()
        .padStart(2, "0")}-${date.getDate().toString().padStart(2, "0")}`;
}

function getDayIndex(date) {
    const falseIndex = date.getDay();
    return falseIndex == 0 ? 6 : falseIndex - 1;
}

function generateId(length) {
    const chars = "ABCDEFGHIHJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    let id = "";
    for (let i = 0; i < length; i++) {
        const rand = Math.floor(Math.random() * chars.length);
        id += chars.charAt(rand);
    }
    return id;
}
